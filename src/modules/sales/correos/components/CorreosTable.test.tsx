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
import {
  TAMANO_BLOQUE_CORREOS,
  TAMANO_PAGINA_CORREOS,
  type CorreoFila,
  type IngresoCorreo,
} from "../types/correos.types";
import { CorreosTable } from "./CorreosTable";

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
  idRegistro: "299",
  registradoEn: "2026-11-03T13:28:42.556Z",
  actualizadoEn: "2026-11-03T13:29:10.000Z",
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
  tamano: TAMANO_BLOQUE_CORREOS,
  filas,
});

/** `cantidad` correos distintos, numerados desde `desde` (asunto «Correo 1», «Correo 2»…). */
const filasDe = (cantidad: number, desde = 1): CorreoFila[] =>
  Array.from({ length: cantidad }, (_, i) =>
    fila({
      messageId: `msg-${desde + i}`,
      asunto: `Correo ${desde + i}`,
      de: `remitente${desde + i}@hotel.example`,
    }),
  );

const BOTON_INGRESAR = /Ingresar como OV/;

function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

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
    // el flujo ya lo ingresó: se dice en pasado y sin botón
    expect(screen.getByText("Ingresado por el flujo")).toBeInTheDocument();
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

  describe("detalle del correo", () => {
    const completa = () =>
      fila({
        para: "ventas@aguacates.example, facturacion@aguacates.example",
        hilo: "hilo-77",
        messageId: "msg-detalle-1",
        motivo: "Es una cotización y no pide surtir mercancía",
      });

    it("al hacer clic en una fila abre el modal con todo lo que trae la data table", async () => {
      api.listarCorreos.mockResolvedValue(lista([completa()]));
      const user = usuario();
      render(<CorreosTable modo="descartados" />);

      await user.click(await screen.findByText("compras@hotel.com"));

      const dialogo = await screen.findByRole("dialog");
      const en = within(dialogo);
      expect(en.getByRole("heading", { name: "Pedido XEL", level: 2 })).toBeInTheDocument();
      expect(dialogo).toHaveTextContent(/Recibido el 3 de noviembre de 2026/);
      // lo que la vista previa no muestra
      expect(en.getByText("ventas@aguacates.example")).toBeInTheDocument();
      expect(en.getByText("facturacion@aguacates.example")).toBeInTheDocument();
      expect(en.getByText("msg-detalle-1")).toBeInTheDocument();
      expect(en.getByText("hilo-77")).toBeInTheDocument();
      expect(en.getByText("299")).toBeInTheDocument();
      expect(en.getByText("Descartado por el flujo")).toBeInTheDocument();
      expect(dialogo).toHaveTextContent(/Registrado en n8n3 de noviembre de 2026/);
      expect(dialogo).toHaveTextContent(/Última actualización3 de noviembre de 2026/);
      // lo que la vista previa recorta, completo
      expect(en.getByText("Es una cotización y no pide surtir mercancía")).toBeInTheDocument();
      expect(en.getByText("pedido.pdf")).toBeInTheDocument();
    });

    it("también se abre con el asunto desde el teclado y se cierra con Cerrar o con Escape", async () => {
      api.listarCorreos.mockResolvedValue(lista([completa()]));
      const user = usuario();
      render(<CorreosTable modo="descartados" />);

      const asunto = await screen.findByRole("button", { name: "Pedido XEL" });
      asunto.focus();
      await user.keyboard("{Enter}");
      const dialogo = await screen.findByRole("dialog");

      await user.click(within(dialogo).getByRole("button", { name: "Cerrar" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(asunto);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("el botón de ingreso de la fila no abre el detalle", async () => {
      api.listarCorreos.mockResolvedValue(lista([completa()]));
      api.ingresarCorreo.mockResolvedValue(ingreso({ messageId: "msg-detalle-1" }));
      const user = usuario();
      render(<CorreosTable modo="descartados" />);

      await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

      expect(api.ingresarCorreo).toHaveBeenCalledWith("msg-detalle-1");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("desde el modal se puede ingresar y el avance se ve ahí mismo", async () => {
      api.listarCorreos.mockResolvedValue(lista([completa()]));
      api.ingresarCorreo.mockResolvedValue(ingreso({ messageId: "msg-detalle-1" }));
      const user = usuario();
      render(<CorreosTable modo="descartados" />);
      await user.click(await screen.findByText("compras@hotel.com"));
      const dialogo = await screen.findByRole("dialog");

      await user.click(within(dialogo).getByRole("button", { name: BOTON_INGRESAR }));

      expect(api.ingresarCorreo).toHaveBeenCalledTimes(1);
      expect(within(dialogo).getByText("Ingresando pedido…")).toBeInTheDocument();
    });

    it("un correo que pasó el flujo se muestra como ingresado por el flujo", async () => {
      api.listarCorreos.mockResolvedValue(
        lista([{ ...completa(), nuevoPedido: null, motivo: null }]),
      );
      const user = usuario();
      render(<CorreosTable modo="todos" />);

      await user.click(await screen.findByText("compras@hotel.com"));

      const dialogo = await screen.findByRole("dialog");
      expect(within(dialogo).getAllByText("Ingresado por el flujo").length).toBeGreaterThan(0);
      expect(within(dialogo).queryByRole("button", { name: BOTON_INGRESAR })).not.toBeInTheDocument();
    });

    it("con varios adjuntos, la tabla muestra el primero y cuántos faltan, y el modal una ficha por archivo", async () => {
      api.listarCorreos.mockResolvedValue(
        lista([
          {
            ...completa(),
            adjunto: "PO_2000.pdf | detalle.xlsx | foto.jpg",
          },
        ]),
      );
      const user = usuario();
      render(<CorreosTable modo="descartados" />);

      expect(await screen.findByText("PO_2000.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("y 2 adjuntos más")).toHaveTextContent("+2");
      expect(screen.queryByText("detalle.xlsx")).not.toBeInTheDocument();

      await user.click(screen.getByText("compras@hotel.com"));

      const dialogo = await screen.findByRole("dialog");
      const en = within(dialogo);
      expect(en.getByText("Adjuntos")).toBeInTheDocument();
      expect(en.getAllByRole("listitem").map((el) => el.textContent)).toEqual(
        expect.arrayContaining(["PO_2000.pdf", "detalle.xlsx", "foto.jpg"]),
      );
    });

    it("muestra el nombre del remitente aparte de su dirección y explica qué hará el botón", async () => {
      api.listarCorreos.mockResolvedValue(
        lista([
          {
            ...completa(),
            de: '"Ana Torres" <ana@restaurantemar.example>',
          },
        ]),
      );
      const user = usuario();
      render(<CorreosTable modo="descartados" />);

      await user.click(await screen.findByText(/Ana Torres/));

      const dialogo = await screen.findByRole("dialog");
      expect(within(dialogo).getByText("Ana Torres")).toBeInTheDocument();
      expect(within(dialogo).getByText("ana@restaurantemar.example")).toBeInTheDocument();
      expect(dialogo).toHaveTextContent(
        "Crea una orden de venta por confirmar leyendo el correo y su adjunto.",
      );
    });

    it("no explica un ingreso que ya no se puede hacer", async () => {
      api.listarCorreos.mockResolvedValue(
        lista([{ ...completa(), nuevoPedido: null, motivo: null }]),
      );
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await user.click(await screen.findByText("compras@hotel.com"));

      const dialogo = await screen.findByRole("dialog");
      expect(dialogo).not.toHaveTextContent("Crea una orden de venta por confirmar");
    });

    it("si el flujo no dejó motivo, lo dice", async () => {
      api.listarCorreos.mockResolvedValue(lista([{ ...completa(), motivo: null }]));
      const user = usuario();
      render(<CorreosTable modo="descartados" />);
      await user.click(await screen.findByText("compras@hotel.com"));

      expect(await screen.findByText("El flujo no dejó un motivo.")).toBeInTheDocument();
    });

    it("sin fecha ni datos opcionales muestra rayas y no se rompe", async () => {
      api.listarCorreos.mockResolvedValue(
        lista([
          fila({
            recibidoEn: null,
            para: null,
            hilo: null,
            adjunto: null,
            motivo: null,
            idRegistro: null,
            registradoEn: null,
            actualizadoEn: null,
          }),
        ]),
      );
      const user = usuario();
      render(<CorreosTable modo="descartados" />);

      await user.click(await screen.findByText("compras@hotel.com"));

      const dialogo = await screen.findByRole("dialog");
      expect(dialogo).toHaveTextContent("Sin fecha de recepción");
      expect(within(dialogo).getAllByText("—").length).toBeGreaterThanOrEqual(6);
    });
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

  describe("paginación", () => {
    it("pasa de página sobre lo ya descargado, sin volver al servidor", async () => {
      api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
      expect(screen.getByText("Correo 5")).toBeInTheDocument();
      expect(screen.queryByText("Correo 6")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Correo 6")).toBeInTheDocument();
      expect(screen.getByText("Correo 10")).toBeInTheDocument();
      expect(screen.queryByText("Correo 1")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Correo 11")).toBeInTheDocument();
      expect(screen.getByText("Correo 12")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Página anterior" }));
      expect(screen.getByText("Correo 6")).toBeInTheDocument();

      // un solo viaje al servidor para recorrer las tres páginas
      expect(api.listarCorreos).toHaveBeenCalledTimes(1);
    });

    it("trae el siguiente bloque antes de llegar, así cruzar de bloque no espera", async () => {
      const POR_BLOQUE = TAMANO_BLOQUE_CORREOS / TAMANO_PAGINA_CORREOS;
      api.listarCorreos.mockImplementation(
        ({ pagina }: { pagina: number }) =>
          Promise.resolve(
            lista(
              filasDe(
                Math.min(TAMANO_BLOQUE_CORREOS, 120 - (pagina - 1) * TAMANO_BLOQUE_CORREOS),
                (pagina - 1) * TAMANO_BLOQUE_CORREOS + 1,
              ),
              120,
            ),
          ),
      );
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      expect(screen.getByText(`Página 1 de ${120 / TAMANO_PAGINA_CORREOS}`)).toBeInTheDocument();
      // primero solo el bloque 1: aún lejos del final
      expect(api.listarCorreos).toHaveBeenCalledTimes(1);

      // se avanza hasta el penúltimo tramo del bloque (el aviso previo)
      for (let i = 1; i < POR_BLOQUE - 2; i += 1) {
        await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      }
      await screen.findByText(`Correo ${(POR_BLOQUE - 3) * TAMANO_PAGINA_CORREOS + 1}`);
      await vi.waitFor(() => expect(api.listarCorreos).toHaveBeenCalledTimes(2));
      expect(api.listarCorreos).toHaveBeenLastCalledWith(
        expect.objectContaining({ pagina: 2, tamano: TAMANO_BLOQUE_CORREOS }),
        expect.any(AbortSignal),
      );

      // al cruzar al bloque 2 las filas aparecen y no se pide nada más
      for (let i = POR_BLOQUE - 2; i <= POR_BLOQUE; i += 1) {
        await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      }
      expect(await screen.findByText("Correo 51")).toBeInTheDocument();
      expect(api.listarCorreos).toHaveBeenCalledTimes(2);
    });

    it("al filtrar vuelve a la primera página y descarta lo guardado", async () => {
      api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Correo 6")).toBeInTheDocument();

      api.listarCorreos.mockResolvedValue(lista(filasDe(2, 100), 2));
      await user.type(screen.getByLabelText("Buscar asunto…"), "x");
      await act(() => vi.advanceTimersByTimeAsync(400));

      expect(await screen.findByText("Correo 100")).toBeInTheDocument();
      expect(screen.getByText("Mostrando 1–2 de 2")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Página siguiente" })).not.toBeInTheDocument();
      expect(screen.queryByText("Correo 6")).not.toBeInTheDocument();
    });

    it("al actualizar vuelve a pedir los correos y no se queda en una página que ya no existe", async () => {
      api.listarCorreos.mockResolvedValueOnce(lista(filasDe(12), 12));
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Página 3 de 3")).toBeInTheDocument();

      api.listarCorreos.mockResolvedValue(lista(filasDe(6), 6));
      await user.click(screen.getByRole("button", { name: "Actualizar lista de correos" }));

      expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
      expect(screen.getByText("Correo 6")).toBeInTheDocument();
      expect(api.listarCorreos).toHaveBeenCalledTimes(2);
    });
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
