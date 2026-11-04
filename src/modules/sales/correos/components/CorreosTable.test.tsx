import { act, render, screen, within } from "@testing-library/react";
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
import { TAMANO_BLOQUE_CORREOS, TAMANO_PAGINA_CORREOS } from "../types/correos.types";
import { BOTON_INGRESAR, fila, ingreso, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

describe("CorreosTable — lista, filtros y estados (REQ-104)", () => {
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
    // el flujo ya lo ingresó: se dice en pasado y sin botón
    expect(screen.getByText("Ingresado por Mateo")).toBeInTheDocument();
    expect(screen.queryByText(/Lo ingresa el flujo/)).not.toBeInTheDocument();
    expect(screen.getByText("OV-00001318")).toBeInTheDocument();
    expect(screen.getByText("Total: 3")).toBeInTheDocument();
    expect(api.listarCorreos).toHaveBeenCalledWith(
      expect.objectContaining({
        modo: "descartados",
        pagina: 1,
        tamano: TAMANO_BLOQUE_CORREOS,
      }),
      expect.any(AbortSignal),
    );
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

  it("usa las mismas filas por página que el resto de las tablas y completa la altura con filas de relleno", async () => {
    expect(TAMANO_PAGINA_CORREOS).toBe(5);
    api.listarCorreos.mockResolvedValue(lista([fila(), fila({ messageId: "m2" })], 2));
    const { container } = render(<CorreosTable modo="todos" />);
    await screen.findAllByText("Pedido XEL");

    const cuerpo = container.querySelector("tbody") as HTMLElement;
    const reales = cuerpo.querySelectorAll("tr:not([aria-hidden])");
    const relleno = cuerpo.querySelectorAll('tr[aria-hidden="true"]');
    expect(reales).toHaveLength(2);
    expect(reales.length + relleno.length).toBe(TAMANO_PAGINA_CORREOS);
    // la altura del cuerpo queda reservada, así la tabla no salta al paginar
    const contenedor = container.querySelector("table")?.parentElement as HTMLElement;
    expect(contenedor.style.minHeight).toBe(`${TAMANO_PAGINA_CORREOS * 3.25}rem`);
  });

  it("un motivo largo se recorta a dos líneas dentro de su badge y la tabla mantiene sus 5 filas", async () => {
    const motivoLargo = "El correo no trae una orden de compra legible. ".repeat(12).trim();
    api.listarCorreos.mockResolvedValue(
      lista([fila({ motivo: motivoLargo }), fila({ messageId: "m2", motivo: null })]),
    );

    const { container } = render(<CorreosTable modo="descartados" />);

    const texto = await screen.findByText(motivoLargo);
    expect(texto).toHaveClass("line-clamp-2");
    // el recorte vive dentro del badge: el motivo completo queda en el tooltip y en el modal
    expect(texto.parentElement).toHaveAttribute("title", motivoLargo);
    // 2 filas con datos + relleno aria-hidden: el cuerpo siempre tiene la altura de la página
    expect(container.querySelectorAll("tbody tr")).toHaveLength(TAMANO_PAGINA_CORREOS);
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
