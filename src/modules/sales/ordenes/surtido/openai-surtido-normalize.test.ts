import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  asNullableString,
  buildOriginalSnapshot,
  normalizePayload,
} from "./openai-surtido-normalize";

const original = {
  folio: "OV-1",
  cliente: "X",
  lineas: [{ producto: "A", especificacion: "", cantidadSolicitada: "1 kg" }],
} as OrdenTareaAlmacenPrintData;

describe("asNullableString", () => {
  it("trimea y nullifica vacío", () => {
    expect(asNullableString("  hi ")).toBe("hi");
    expect(asNullableString("   ")).toBeNull();
  });
});

describe("buildOriginalSnapshot", () => {
  it("incluye índices 1-based", () => {
    const snap = JSON.parse(buildOriginalSnapshot(original));
    expect(snap.lineas[0].indice).toBe(1);
  });
});

describe("normalizePayload", () => {
  it("mapea cabecera y lineas", () => {
    const payload = normalizePayload(
      {
        cabecera: { chofer: "  Luis  " },
        checks: {},
        lineas: [{ indice: 1, alisto: true, reviso: false }],
        camposExtra: [],
        observacionesIa: null,
        calidadFoto: {
          esHojaSurtido: true,
          hojaCompletaYLegible: true,
          motivo: "",
        },
      },
      original,
    );
    expect(payload.campos.chofer).toBe("Luis");
    expect(payload.lineas).toHaveLength(1);
    expect(payload.lineas[0]?.alisto).toBe(true);
  });
});