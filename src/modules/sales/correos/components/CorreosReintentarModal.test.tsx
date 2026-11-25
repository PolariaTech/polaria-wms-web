import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CorreosApiError } from "../services/correos.client";
import { fila, ingreso } from "../testing/correos.fixtures";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));

vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...api,
}));

import { CorreosReintentarModal } from "./CorreosReintentarModal";

const pendiente = fila({
  messageId: "m-err",
  asunto: "Pedido fallido",
  ingreso: ingreso({
    messageId: "m-err",
    estado: "error",
    error: "El ingreso no terminó. Toca Reintentar.",
  }),
});

describe("CorreosReintentarModal (REQ-387)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cierra el modal cuando el lote ingresa", async () => {
    api.listarCorreos.mockResolvedValue({
      total: 1,
      pagina: 1,
      tamano: 50,
      filas: [pendiente],
    });
    api.ingresarCorreo.mockResolvedValue(
      ingreso({
        messageId: "m-err",
        estado: "ingresado",
        codigoOrdenVenta: "OV-1",
      }),
    );
    const onClose = vi.fn();
    const onTerminado = vi.fn();
    const usuario = userEvent.setup();

    render(
      <CorreosReintentarModal
        open
        onClose={onClose}
        onTerminado={onTerminado}
      />,
    );

    await screen.findByText("Pedido fallido");
    await usuario.click(
      screen.getByRole("button", { name: "Reintentar para todos" }),
    );

    await waitFor(() => {
      expect(api.ingresarCorreo).toHaveBeenCalledWith(
        "m-err",
        expect.any(AbortSignal),
      );
      expect(onTerminado).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("deja el error real del api en la fila si el lote falla", async () => {
    api.listarCorreos.mockResolvedValue({
      total: 1,
      pagina: 1,
      tamano: 50,
      filas: [pendiente],
    });
    api.ingresarCorreo.mockRejectedValue(
      new CorreosApiError(
        "Hay demasiadas solicitudes en poco tiempo. Espera un momento e inténtalo de nuevo.",
        "LIMITE_SOLICITUDES",
        429,
      ),
    );
    const usuario = userEvent.setup();

    render(
      <CorreosReintentarModal open onClose={vi.fn()} onTerminado={vi.fn()} />,
    );

    await screen.findByText("Pedido fallido");
    await usuario.click(
      screen.getByRole("button", { name: "Reintentar para todos" }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/1 de 1 fallaron.*demasiadas solicitudes/i);
    expect(
      screen.getAllByText(/demasiadas solicitudes/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("muestra el error de negocio cuando el proceso termina sin OV", async () => {
    api.listarCorreos.mockResolvedValue({
      total: 1,
      pagina: 1,
      tamano: 50,
      filas: [pendiente],
    });
    api.ingresarCorreo.mockResolvedValue(
      ingreso({
        messageId: "m-err",
        estado: "error",
        error: "No se encontraron productos con cantidades en el correo.",
      }),
    );
    const usuario = userEvent.setup();

    render(
      <CorreosReintentarModal open onClose={vi.fn()} onTerminado={vi.fn()} />,
    );
    await screen.findByText("Pedido fallido");
    await usuario.click(
      screen.getByRole("button", { name: "Reintentar para todos" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /1 de 1 fallaron.*No se encontraron productos/i,
    );
  });

  it("muestra vacío si no hay pendientes", async () => {
    api.listarCorreos.mockResolvedValue({
      total: 0,
      pagina: 1,
      tamano: 50,
      filas: [],
    });

    render(
      <CorreosReintentarModal open onClose={vi.fn()} onTerminado={vi.fn()} />,
    );

    expect(
      await screen.findByText("No hay correos pendientes de reintentar."),
    ).toBeInTheDocument();
  });

  it("permite detener el lote sin perder los correos restantes", async () => {
    const segundo = fila({
      messageId: "m-2",
      asunto: "Segundo pedido",
      ingreso: ingreso({ messageId: "m-2", estado: "error", error: "Falló" }),
    });
    api.listarCorreos.mockResolvedValue({
      total: 2,
      pagina: 1,
      tamano: 50,
      filas: [pendiente, segundo],
    });
    api.ingresarCorreo.mockImplementation(
      (_id: string, signal?: AbortSignal) =>
        new Promise((_res, rej) => {
          signal?.addEventListener("abort", () =>
            rej(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const usuario = userEvent.setup();

    render(
      <CorreosReintentarModal open onClose={vi.fn()} onTerminado={vi.fn()} />,
    );
    await screen.findByText("Pedido fallido");
    await usuario.click(
      screen.getByRole("button", { name: "Reintentar para todos" }),
    );

    const botonDetener = await screen.findByRole("button", { name: "Detener" });
    await usuario.click(botonDetener);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Lote detenido; quedan 2 pendientes/i,
    );
    expect(screen.getByText("Pedido fallido")).toBeInTheDocument();
    expect(screen.getByText("Segundo pedido")).toBeInTheDocument();
    expect(api.ingresarCorreo).toHaveBeenCalledTimes(1);
  });

  it("trata YA_INGRESADO (409) como ingresado y refresca la tabla", async () => {
    api.listarCorreos.mockResolvedValue({
      total: 1,
      pagina: 1,
      tamano: 50,
      filas: [pendiente],
    });
    api.ingresarCorreo.mockRejectedValue(
      new CorreosApiError(
        "Este pedido ya fue ingresado como OV-9.",
        "YA_INGRESADO",
        409,
      ),
    );
    const onClose = vi.fn();
    const onTerminado = vi.fn();
    const usuario = userEvent.setup();

    render(
      <CorreosReintentarModal
        open
        onClose={onClose}
        onTerminado={onTerminado}
      />,
    );
    await screen.findByText("Pedido fallido");
    await usuario.click(
      screen.getByRole("button", { name: "Reintentar para todos" }),
    );

    await waitFor(() => {
      expect(onTerminado).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("corta el lote ante 429 sin disparar los correos restantes", async () => {
    const segundo = fila({
      messageId: "m-2",
      asunto: "Segundo pedido",
      ingreso: ingreso({ messageId: "m-2", estado: "error", error: "Falló" }),
    });
    api.listarCorreos.mockResolvedValue({
      total: 2,
      pagina: 1,
      tamano: 50,
      filas: [pendiente, segundo],
    });
    api.ingresarCorreo.mockRejectedValue(
      new CorreosApiError(
        "Hay demasiadas solicitudes en poco tiempo.",
        "LIMITE_SOLICITUDES",
        429,
      ),
    );
    const usuario = userEvent.setup();

    render(
      <CorreosReintentarModal open onClose={vi.fn()} onTerminado={vi.fn()} />,
    );
    await screen.findByText("Pedido fallido");
    await usuario.click(
      screen.getByRole("button", { name: "Reintentar para todos" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /demasiadas solicitudes/i,
    );
    expect(api.ingresarCorreo).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Segundo pedido")).toBeInTheDocument();
  });
});
