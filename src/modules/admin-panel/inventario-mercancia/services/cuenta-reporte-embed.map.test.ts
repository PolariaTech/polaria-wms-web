import { describe, expect, it } from "vitest";
import { mapEmbedRow } from "./cuenta-reporte-embed.map";

describe("mapEmbedRow", () => {
  it("mapea y normaliza los campos", () => {
    expect(
      mapEmbedRow({
        id_cuenta_reporte_embed: "e1",
        codigo_cuenta: "MIT00",
        descripcion: "  Stock  ",
        reporte_id: null,
        embed_url: " https://x ",
        esta_activo: null,
      }),
    ).toEqual({
      idCuentaReporteEmbed: "e1",
      codigoCuenta: "MIT00",
      descripcion: "Stock",
      reporteId: "",
      embedUrl: "https://x",
      estaActivo: true,
    });
  });

  it("respeta esta_activo=false", () => {
    expect(
      mapEmbedRow({
        id_cuenta_reporte_embed: "e1",
        codigo_cuenta: "C",
        descripcion: "  ",
        reporte_id: "r",
        embed_url: "u",
        esta_activo: false,
      }),
    ).toMatchObject({ descripcion: null, estaActivo: false });
  });
});
