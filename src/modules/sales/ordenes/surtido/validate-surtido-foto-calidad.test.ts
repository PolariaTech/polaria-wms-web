import { describe, expect, it } from "vitest";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";
import {
  MSG_CAPTURA_FOTO_MALA,
  MSG_CAPTURA_NO_HOJA,
  UMBRAL_PRECISION_ACEPTABLE,
  evaluarCalidadFotoSurtido,
} from "./validate-surtido-foto-calidad";

function basePayload(
  partial: Partial<OrdenSurtidoCapturaPayload> = {},
): OrdenSurtidoCapturaPayload {
  return {
    campos: {},
    checks: {},
    lineas: [],
    ...partial,
  };
}

describe("evaluarCalidadFotoSurtido", () => {
  it("rechaza si no es la hoja de surtido", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({
        calidadFoto: {
          esHojaSurtido: false,
          hojaCompletaYLegible: false,
          motivo: "Solo se ven manos y una caja",
        },
        precisionEstimada: 80,
      }),
    );
    expect(result).toEqual({
      ok: false,
      error: MSG_CAPTURA_NO_HOJA,
      codigo: "no_hoja",
    });
  });

  it("acepta hoja imperfecta si hay precisión >= umbral (~40%)", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({
        calidadFoto: {
          esHojaSurtido: true,
          hojaCompletaYLegible: false,
          motivo: "Ángulo lateral; hora impresa borrosa",
        },
        precisionEstimada: UMBRAL_PRECISION_ACEPTABLE,
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it("acepta hoja imperfecta si hay señal de lectura aunque precisión sea baja", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({
        calidadFoto: {
          esHojaSurtido: true,
          hojaCompletaYLegible: false,
          motivo: "Encuadre flojo",
        },
        precisionEstimada: 12,
        campos: { chofer: "Luis" },
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it("rechaza hoja ilegible sin señal ni precisión suficiente", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({
        calidadFoto: {
          esHojaSurtido: true,
          hojaCompletaYLegible: false,
          motivo: "Demasiado borrosa",
        },
        precisionEstimada: 10,
      }),
    );
    expect(result).toEqual({
      ok: false,
      error: MSG_CAPTURA_FOTO_MALA,
      codigo: "foto_mala",
    });
  });

  it("acepta hoja completa y legible", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({
        calidadFoto: {
          esHojaSurtido: true,
          hojaCompletaYLegible: true,
          motivo: "",
        },
        precisionEstimada: 12,
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it("sin calidadFoto: rechaza precisión bajo umbral sin señal", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({ precisionEstimada: 8 }),
    );
    expect(result).toEqual({
      ok: false,
      error: MSG_CAPTURA_FOTO_MALA,
      codigo: "precision_baja",
    });
  });

  it("sin calidadFoto: acepta si precisión >= umbral", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({ precisionEstimada: UMBRAL_PRECISION_ACEPTABLE }),
    );
    expect(result).toEqual({ ok: true });
  });

  it("sin calidadFoto: acepta si hay señal de lectura aunque precisión sea baja", () => {
    const result = evaluarCalidadFotoSurtido(
      basePayload({
        precisionEstimada: 10,
        campos: { chofer: "Luis" },
      }),
    );
    expect(result).toEqual({ ok: true });
  });
});
