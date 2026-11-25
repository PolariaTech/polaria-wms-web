import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { applyPedidoCabeceraToPatch } from "./map-pedido-extraido-apply-cabecera";

const emptyFicha = () => ({
  centroConsumo: "",
  ventanaDesde: "",
  ventanaHasta: "",
  direccion: "",
  anden: "",
  contacto: "",
  telefono: "",
  correo: "",
  aceptaSustituciones: "",
  requiereLote: "",
  registrarTemperatura: "",
  observaciones: "",
});

describe("map-pedido-extraido-apply-cabecera", () => {
  it("applyPedidoCabeceraToPatch está exportado", () => {
    expect(typeof applyPedidoCabeceraToPatch).toBe("function");
  });

  it("asigna fecha de entrega leída del pedido", () => {
    const pedido = {
      fechaEntrega: "2026-09-07",
      lineas: [],
      origenCorreo: [],
    } as PedidoExtraido;
    const { patch, autoFields } = applyPedidoCabeceraToPatch({
      pedido,
      ficha: emptyFicha(),
      tomorrowIso: "2026-09-08",
      todayIso: "2026-09-06",
    });
    expect(patch.fechaEntrega).toBe("2026-09-07");
    expect(autoFields.has("fechaEntrega")).toBe(true);
  });
});