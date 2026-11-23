import { describe, expect, it } from "vitest";
import { EMBED_SELECT } from "./cuenta-reporte-embed.types";

describe("cuenta-reporte-embed.types", () => {
  it("EMBED_SELECT incluye las columnas requeridas por el mapper", () => {
    expect(EMBED_SELECT.split(",")).toEqual([
      "id_cuenta_reporte_embed",
      "codigo_cuenta",
      "descripcion",
      "reporte_id",
      "embed_url",
      "esta_activo",
    ]);
  });
});
