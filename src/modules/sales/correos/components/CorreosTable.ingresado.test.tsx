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
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/ventas/correos-descartados",
  useRouter: () => ({ replace: vi.fn() }),
}));

import { BOTON_INGRESAR, fila, ingreso, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

const FILA_A = fila({ messageId: "msg-a", asunto: "Pedido A" });
const FILA_B = fila({ messageId: "msg-b", asunto: "Pedido B" });
const INGRESADO_A = ingreso({
  messageId: "msg-a",
  estado: "ingresado",
  codigoOrdenVenta: "OV-00000123",
  idOrdenVenta: "7",
  error: null,
});

describe("CorreosTable — recarga al ingresar (REQ-314)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    api.listarCorreos.mockReset();
    api.ingresarCorreo.mockReset();
    api.consultarIngreso.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("en descartados recarga al terminar ingresado y saca el correo", async () => {
    api.listarCorreos
      .mockResolvedValueOnce(lista([FILA_A, FILA_B], 2))
      .mockResolvedValueOnce(lista([FILA_B], 1));
    api.ingresarCorreo.mockResolvedValue(INGRESADO_A);
    const user = usuario();

    render(<CorreosTable modo="descartados" />);
    await user.click(
      await screen.findByRole("button", { name: /Ingresar como OV del correo Pedido A/ }),
    );

    expect(await screen.findByText("Total: 1")).toBeInTheDocument();
    expect(screen.getByText("Pedido B")).toBeInTheDocument();
    expect(screen.queryByText("Pedido A")).not.toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledTimes(2);
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "success",
        content: expect.stringContaining("OV-00000123") as string,
      }),
    );
  });

  it("también recarga una sola vez si el ingreso pasa por procesando", async () => {
    api.listarCorreos
      .mockResolvedValueOnce(lista([FILA_A, FILA_B], 2))
      .mockResolvedValueOnce(lista([FILA_B], 1));
    api.ingresarCorreo.mockResolvedValue(
      ingreso({ messageId: "msg-a", estado: "procesando" }),
    );
    api.consultarIngreso.mockResolvedValue(INGRESADO_A);
    const user = usuario();

    render(<CorreosTable modo="descartados" />);
    await user.click(
      await screen.findByRole("button", { name: /Ingresar como OV del correo Pedido A/ }),
    );
    expect(screen.getByText("Ingresando pedido…")).toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(await screen.findByText("Pedido B")).toBeInTheDocument();
    expect(screen.queryByText("Pedido A")).not.toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledTimes(2);
  });

  it("si el ingreso falla no recarga y deja Reintentar", async () => {
    api.listarCorreos.mockResolvedValue(lista([FILA_A, FILA_B], 2));
    api.ingresarCorreo.mockResolvedValue(
      ingreso({
        messageId: "msg-a",
        estado: "error",
        error: "No se pudo leer el adjunto.",
      }),
    );
    const user = usuario();

    render(<CorreosTable modo="descartados" />);
    await user.click(
      await screen.findByRole("button", { name: /Ingresar como OV del correo Pedido A/ }),
    );

    expect(
      await screen.findByRole("button", { name: /Reintentar el ingreso/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pedido A")).toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledTimes(1);
  });

  it("en procesados un ingreso exitoso no recarga", async () => {
    api.listarCorreos.mockResolvedValue(lista([FILA_A], 1));
    api.ingresarCorreo.mockResolvedValue(INGRESADO_A);
    const user = usuario();

    render(<CorreosTable modo="procesados" />);
    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

    expect(await screen.findByText(/Ingresado como/)).toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledTimes(1);
  });
});
