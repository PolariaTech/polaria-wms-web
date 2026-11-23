import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";
import {
  emptyPedido,
} from "./map-pedido-extraido-to-form.test-helpers";

describe("mapPedidoExtraidoToForm", () => {

  it("prioriza fecha y hora del cuerpo sobre el default de mañana", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        fechaEntrega: null,
        horarioDesde: null,
        horarioHasta: null,
        textoOrigen: [
          "Envío adjunto pedido para entregar el 27 DE AGOSTO DE 2026:",
          "Hora de entrega 6:00 am",
        ].join("\n"),
      },
      productos: [],
      ficha: {
        centroConsumo: "",
        ventanaDesde: "10:00",
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
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-08-20",
    });

    expect(mapped.fechaEntrega).toBe("2026-08-27");
    expect(mapped.ventanaDesde).toBe("06:00");
    expect(mapped.warnFields.has("fechaEntrega")).toBe(false);
    expect(mapped.autoFields.has("fechaEntrega")).toBe(true);
  });

});
