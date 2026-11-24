import { describe, expect, it } from "vitest";
import type { PedidoIaFormPatch } from "./map-pedido-extraido-to-form.types";

describe("map-pedido-extraido-to-form.types", () => {
  it("exports PedidoIaFormPatch shape for type-only consumers", () => {
    const patch = {
      fechaEntrega: "",
      centroConsumo: "",
      observaciones: "",
      ordenCompraHotel: "",
      direccion: "",
      anden: "",
      contacto: "",
      telefono: "",
      correo: "",
      ventanaDesde: "",
      ventanaHasta: "",
      aceptaSustituciones: "",
      requiereLote: "",
      registrarTemperatura: "",
      autoFields: new Set<string>(),
      warnFields: new Set<string>(),
      missingFields: new Set<string>(),
      discrepancias: [],
      lineas: [],
      advertencia: null,
      archivosNoLegibles: [],
    } satisfies PedidoIaFormPatch;
    expect(patch.lineas).toEqual([]);
  });
});