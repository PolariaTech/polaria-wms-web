import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
  obtenerCorreoCompleto: vi.fn(),
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

import { BOTON_INGRESAR, fila, ingreso, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

describe("CorreosTable — detalle del correo (REQ-104)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    api.obtenerCorreoCompleto.mockResolvedValue({});
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("al abrir el detalle pide el correo en segundo plano, y si falla no molesta", async () => {
    api.obtenerCorreoCompleto.mockRejectedValue(new Error("n8n no respondió."));
    api.listarCorreos.mockResolvedValue(lista([fila({ messageId: "msg-detalle-1" })]));
    const user = usuario();
    render(<CorreosTable modo="descartados" />);
    expect(api.obtenerCorreoCompleto).not.toHaveBeenCalled();

    await user.click(await screen.findByText("compras@hotel.com"));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(api.obtenerCorreoCompleto).toHaveBeenCalledWith("msg-detalle-1");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

    const completa = () =>
      fila({
        para: "ventas@aguacates.example, facturacion@aguacates.example",
        hilo: "hilo-77",
        messageId: "msg-detalle-1",
        motivo: "Es una cotización y no pide surtir mercancía",
      });

    it("ofrece ver el correo completo en una pestaña nueva, sin acceso a esta", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila({ messageId: "msg-detalle-1" })]));
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByText("compras@hotel.com"));

    const enlace = within(await screen.findByRole("dialog")).getByRole("link", {
      name: "Ver correo completo",
    });
    expect(enlace).toHaveAttribute("href", "/dashboard/ventas/correo/msg-detalle-1");
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
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
