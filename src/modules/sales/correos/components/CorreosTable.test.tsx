import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import type { CorreoFila, IngresoCorreo } from "../types/correos.types";
import { CorreosTable, formatearRecibido } from "./CorreosTable";

const MSG = "msg-descartado-1";

const fila = (parcial: Partial<CorreoFila> = {}): CorreoFila => ({
  recibidoEn: "2026-11-03T13:27:51.000Z",
  de: "compras@hotel.com",
  para: null,
  asunto: "Pedido XEL",
  messageId: MSG,
  hilo: null,
  adjunto: "pedido.pdf",
  nuevoPedido: false,
  motivo: "Cotización, no es pedido",
  ingreso: null,
  ...parcial,
});

const ingreso = (parcial: Partial<IngresoCorreo> = {}): IngresoCorreo => ({
  messageId: MSG,
  estado: "procesando",
  idOrdenVenta: null,
  codigoOrdenVenta: null,
  error: null,
  ...parcial,
});

const lista = (filas: CorreoFila[], total = filas.length) => ({
  total,
  pagina: 1,
  tamano: 25,
  filas,
});

const BOTON_INGRESAR = /Ingresar como OV/;

function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

describe("formatearRecibido", () => {
  it("muestra la hora de Colombia (UTC-5) y tolera fechas vacías o inválidas", () => {
    expect(formatearRecibido("2026-11-03T13:27:51.000Z")).toMatch(/0?8:27/);
    expect(formatearRecibido(null)).toBe("—");
    expect(formatearRecibido("no-es-fecha")).toBe("—");
  });
});

describe("CorreosTable (REQ-104)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("solo ofrece ingresar los descartados; los del flujo y los ya ingresados no llevan botón", async () => {
    api.listarCorreos.mockResolvedValue(
      lista([
        fila(),
        fila({ messageId: "m2", asunto: "Orden BirchStreet", nuevoPedido: null, motivo: null }),
        fila({
          messageId: "m3",
          asunto: "Ya entró",
          ingreso: ingreso({
            messageId: "m3",
            estado: "ingresado",
            codigoOrdenVenta: "OV-00001318",
          }),
        }),
      ]),
    );

    render(<CorreosTable modo="descartados" />);

    await screen.findByText("Pedido XEL");
    expect(screen.getAllByRole("button", { name: BOTON_INGRESAR })).toHaveLength(1);
    expect(screen.getByText("Lo ingresa el flujo")).toBeInTheDocument();
    expect(screen.getByText("OV-00001318")).toBeInTheDocument();
    expect(screen.getByText("Total: 3")).toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledWith(
      expect.objectContaining({ modo: "descartados", pagina: 1, tamano: 25 }),
      expect.any(AbortSignal),
    );
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

  it("si falla deja el motivo a la vista y permite reintentar", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    api.ingresarCorreo.mockRejectedValue(
      new CorreosApiError("La IA no extrajo renglones.", "SERVIDOR", 500),
    );
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

    expect(await screen.findByRole("button", { name: /Reintentar el ingreso/ })).toBeInTheDocument();
    const aviso = screen.getAllByRole("alert").find((el) =>
      el.textContent?.includes("La IA no extrajo renglones."),
    );
    expect(aviso).toBeDefined();
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" }),
    );

    api.ingresarCorreo.mockResolvedValue(ingreso());
    await user.click(screen.getByRole("button", { name: /Reintentar el ingreso/ }));
    expect(api.ingresarCorreo).toHaveBeenCalledTimes(2);
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

  it("los filtros esperan a que termines de escribir y vuelven a la primera página", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    const user = usuario();
    render(<CorreosTable modo="todos" />);
    await screen.findByText("Pedido XEL");
    expect(api.listarCorreos).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText("Buscar remitente…"), "hotel");
    expect(api.listarCorreos).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(api.listarCorreos).toHaveBeenCalledTimes(2);
    expect(api.listarCorreos).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagina: 1,
        filtros: expect.objectContaining({ remitente: "hotel" }) as unknown,
      }),
      expect.any(AbortSignal),
    );

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(api.listarCorreos).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filtros: expect.objectContaining({ remitente: "" }) as unknown,
      }),
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
  });

  it("pagina con el servidor", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila()], 60));
    const user = usuario();
    render(<CorreosTable modo="todos" />);
    await screen.findByText("Pedido XEL");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(api.listarCorreos).toHaveBeenLastCalledWith(
      expect.objectContaining({ pagina: 2 }),
      expect.any(AbortSignal),
    );
  });

  it("si la lista falla muestra el motivo y deja reintentar", async () => {
    api.listarCorreos.mockRejectedValueOnce(
      new CorreosApiError("No se pudo consultar los correos en este momento.", "N8N", 502),
    );
    api.listarCorreos.mockResolvedValue(lista([fila()]));
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("No se pudo consultar los correos en este momento.");

    await user.click(within(alerta).getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Pedido XEL")).toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledTimes(2);
  });

  it("explica el vacío según el modo y si hay filtros", async () => {
    api.listarCorreos.mockResolvedValue(lista([]));
    const { unmount } = render(<CorreosTable modo="descartados" />);
    expect(await screen.findByText("El flujo no ha descartado ningún correo.")).toBeInTheDocument();
    unmount();

    api.listarCorreos.mockResolvedValue(lista([]));
    const user = usuario();
    render(<CorreosTable modo="todos" />);
    await screen.findByText("Todavía no hay correos registrados.");
    await user.type(screen.getByLabelText("Buscar asunto…"), "zzz");
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(await screen.findByText("Ningún correo coincide con los filtros.")).toBeInTheDocument();
  });
});
