import { describe, expect, it } from "vitest";
import {
  coercePayload,
  mapRow,
  resolveTituloProducto,
} from "./orden-surtido-captura-mappers";

describe("coercePayload", () => {
  it("rellena valores por defecto", () => {
    expect(coercePayload(null)).toEqual({
      campos: {},
      checks: {},
      lineas: [],
      observacionesIa: null,
    });
  });
});

describe("mapRow", () => {
  it("normaliza id de OT", () => {
    const row = mapRow({
      id_captura: "c1",
      id_orden_venta: "ov1",
      id_orden_trabajo: null,
      codigo_cuenta: "C1",
      url_foto: null,
      payload: null,
      modelo: "gpt",
      updated_at: "2026-01-01",
    });
    expect(row.idOrdenTrabajo).toBe("");
  });
});

describe("resolveTituloProducto", () => {
  it("prefiere metadatos titulo", () => {
    expect(
      resolveTituloProducto({
        metadatos_catalogo: { titulo: "  Fruta  " },
        descripcion: "otro",
      }),
    ).toBe("Fruta");
  });
});