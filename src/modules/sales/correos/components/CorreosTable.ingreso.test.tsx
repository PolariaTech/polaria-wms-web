import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({ applyTenantHeaders: vi.fn() }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: "t" }) },
}));
vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => toast,
}));
vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...api,
}));

import { CorreosApiError } from "../services/correos.client";
import { BOTON_INGRESAR, MSG, fila, ingreso, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

describe("CorreosTable — ingreso como OV (REQ-104)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("al ingresar bloquea el botón, sondea y termina con el chulo, el código de la OV y un aviso", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    api.ingresarCorreo.mockResolvedValue(ingreso());
    api.consultarIngreso
      .mockResolvedValueOnce(ingreso())
      .mockResolvedValueOnce(
        ingreso({ estado: "ingresado", codigoOrdenVenta: "OV-00001319" }),
      );
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

    expect(api.ingresarCorreo).toHaveBeenCalledTimes(1);
    expect(api.ingresarCorreo).toHaveBeenCalledWith(MSG);
    expect(screen.getByText("Ingresando pedido…")).toBeInTheDocument();
    // sin botón no hay segundo clic posible: el pedido no se puede duplicar desde la pantalla
    expect(screen.queryByRole("button", { name: BOTON_INGRESAR })).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(api.consultarIngreso).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Ingresando pedido…")).toBeInTheDocument();
    expect(toast.showToast).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(await screen.findByText("OV-00001319")).toBeInTheDocument();
    expect(screen.getByText(/Ingresado como/)).toBeInTheDocument();
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "success",
        content: expect.stringContaining("OV-00001319") as string,
      }),
    );
    expect(api.ingresarCorreo).toHaveBeenCalledTimes(1);
  });

  it("si el api dice que ya estaba ingresado, muestra su OV sin crear otra", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    api.ingresarCorreo.mockRejectedValue(
      new CorreosApiError("Este pedido ya fue ingresado como OV-00001318.", "YA_INGRESADO", 409),
    );
    api.consultarIngreso.mockResolvedValue(
      ingreso({ estado: "ingresado", codigoOrdenVenta: "OV-00001318" }),
    );
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

    expect(await screen.findByText("OV-00001318")).toBeInTheDocument();
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "info" }),
    );
  });

  it("si falla deja el motivo en el tooltip del botón y permite reintentar", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    api.ingresarCorreo.mockRejectedValue(
      new CorreosApiError("La IA no extrajo renglones.", "SERVIDOR", 500),
    );
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

    const reintentar = await screen.findByRole("button", { name: /Reintentar el ingreso/ });
    // la columna Ingreso solo lleva el botón: el motivo no ensancha la fila (se lee en el modal)
    expect(reintentar).toHaveAttribute("title", "La IA no extrajo renglones.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" }),
    );

    api.ingresarCorreo.mockResolvedValue(ingreso());
    await user.click(screen.getByRole("button", { name: /Reintentar el ingreso/ }));
    expect(api.ingresarCorreo).toHaveBeenCalledTimes(2);
  });

  it("pasados 5 min sigue «Ingresando pedido…» y no fabrica un error local", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    api.ingresarCorreo.mockResolvedValue(ingreso());
    api.consultarIngreso.mockResolvedValue(ingreso());
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));
    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000 + 6_000));

    expect(screen.getByText("Ingresando pedido…")).toBeInTheDocument();
    expect(screen.queryByText(/Tardó más de lo esperado/)).not.toBeInTheDocument();
    expect(toast.showToast).not.toHaveBeenCalled();
    expect(api.consultarIngreso.mock.calls.length).toBeGreaterThan(1);
  });

  it("retoma el seguimiento de un correo que ya venía procesándose", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila({ ingreso: ingreso() })]));
    api.consultarIngreso.mockResolvedValue(
      ingreso({ estado: "ingresado", codigoOrdenVenta: "OV-00001320" }),
    );
    render(<CorreosTable modo="descartados" />);

    expect(await screen.findByText("Ingresando pedido…")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(await screen.findByText("OV-00001320")).toBeInTheDocument();
    expect(api.ingresarCorreo).not.toHaveBeenCalled();
  });
});
