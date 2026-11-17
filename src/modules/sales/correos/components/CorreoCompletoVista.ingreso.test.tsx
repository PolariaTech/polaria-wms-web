import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cliente = vi.hoisted(() => ({
  obtenerCorreoCompleto: vi.fn(),
  descargarAdjunto: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));
const filaCliente = vi.hoisted(() => ({
  obtenerFilaCorreo: vi.fn(),
}));
vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...cliente,
}));
vi.mock("../services/correo-fila.client", () => filaCliente);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast: vi.fn() }),
}));

import { fila, ingreso, usuario } from "../testing/correos.fixtures";
import type { CorreoContenido } from "../types/correos.types";
import { CorreoCompletoVista } from "./CorreoCompletoVista";

const ID = "abc123def";

const correo: CorreoContenido = {
  asunto: "Pedido XEL",
  de: "ana@x.example",
  para: "ventas@x.example",
  fecha: "2026-11-03T13:27:51.000Z",
  texto: "Hola",
  html: "<p>Hola</p>",
  adjuntos: [],
};

async function abrir(filaRespuesta: ReturnType<typeof fila>) {
  cliente.obtenerCorreoCompleto.mockResolvedValue(correo);
  filaCliente.obtenerFilaCorreo.mockResolvedValue(filaRespuesta);
  render(<CorreoCompletoVista messageId={ID} />);
  await screen.findByTitle("Cuerpo del correo");
}

describe("CorreoCompletoVista — ingreso (REQ-318)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("muestra la seguridad del clasificador sin términos técnicos", async () => {
    await abrir(
      fila({
        messageId: ID,
        nuevoPedido: null,
        motivo: null,
        resultado: "duplicado",
        confianza: "baja",
        ingreso: null,
      }),
    );

    expect(screen.getByText("Ya había una orden con ese número")).toBeInTheDocument();
    expect(screen.getByText("Seguridad del clasificador: baja")).toBeInTheDocument();
    expect(screen.queryByText(/duplicado|no_es_pedido|recibido/)).not.toBeInTheDocument();
  });

  it("muestra el veredicto del flujo junto al ingreso", async () => {
    await abrir(
      fila({
        messageId: ID,
        nuevoPedido: false,
        motivo: "Es una cotización y no pide surtir mercancía",
        ingreso: null,
      }),
    );

    expect(screen.getByText("Descartado por el flujo")).toBeInTheDocument();
    expect(
      screen.getByText("Es una cotización y no pide surtir mercancía"),
    ).toBeInTheDocument();
  });

  it("pone Ingresar como OV al lado de Volver, a todo el ancho", async () => {
    await abrir(
      fila({
        messageId: ID,
        nuevoPedido: false,
        resultado: "no_es_pedido",
        confianza: "alta",
        ingreso: null,
      }),
    );

    const barra = screen.getByRole("toolbar", { name: "Acciones del correo" });
    expect(barra.className).toContain("w-full");
    const volver = screen.getByRole("button", { name: "Volver a los correos" });
    const ingresar = screen.getByRole("button", { name: /Ingresar como OV/ });
    expect(volver.parentElement).toBe(ingresar.parentElement);
  });

  it("en un descartado muestra Ingresar como OV y lo dispara", async () => {
    await abrir(
      fila({
        messageId: ID,
        nuevoPedido: false,
        resultado: "no_es_pedido",
        confianza: "alta",
        ingreso: null,
      }),
    );

    expect(
      screen.getByText(
        "Crea una orden de venta por confirmar leyendo el correo y su adjunto.",
      ),
    ).toBeInTheDocument();
    cliente.ingresarCorreo.mockResolvedValue(
      ingreso({
        messageId: ID,
        estado: "ingresado",
        codigoOrdenVenta: "OV-00000123",
      }),
    );
    const boton = screen.getByRole("button", { name: /Ingresar como OV/ });
    await usuario().click(boton);
    expect(cliente.ingresarCorreo).toHaveBeenCalledWith(ID);
  });

  it("si ya está ingresado muestra la OV y no el botón", async () => {
    await abrir(
      fila({
        messageId: ID,
        ingreso: ingreso({
          messageId: ID,
          estado: "ingresado",
          codigoOrdenVenta: "OV-00000123",
        }),
      }),
    );

    expect(screen.getAllByText(/Ingresado como/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("OV-00000123").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /Ingresar como OV/ }),
    ).not.toBeInTheDocument();
  });

  it("si el ingreso falló muestra Reintentar y el error", async () => {
    await abrir(
      fila({
        messageId: ID,
        ingreso: ingreso({
          messageId: ID,
          estado: "error",
          error: "No se pudo leer el adjunto.",
        }),
      }),
    );

    expect(screen.getByRole("button", { name: /Reintentar/ })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo leer el adjunto.",
    );
  });

  it("si no se pudo leer la fila avisa y muestra el correo igual", async () => {
    cliente.obtenerCorreoCompleto.mockResolvedValue(correo);
    filaCliente.obtenerFilaCorreo.mockRejectedValue(new Error("fallo"));
    render(<CorreoCompletoVista messageId={ID} />);
    await screen.findByTitle("Cuerpo del correo");

    expect(
      screen.getByText(
        "No pudimos saber si este correo ya está ingresado. Para ingresarlo, vuelve a la lista.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ingresar como OV/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("ana@x.example")).toBeInTheDocument();
  });

  it("al montar recuerda el correo abierto", async () => {
    await abrir(fila({ messageId: ID }));
    expect(sessionStorage.getItem("polaria.ventas.correos.ultimoAbierto")).toBe(
      ID,
    );
  });
});
