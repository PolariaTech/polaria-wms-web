import { describe, expect, it } from "vitest";
import { unidadYEspecificacionLineaForm } from "./map-pedido-unidad-y-espec";

describe("unidadYEspecificacionLineaForm (REQ-380)", () => {
  it("catálogo KGM + origen PZA → unidad KGM y Pedido en PZA", () => {
    const r = unidadYEspecificacionLineaForm({
      textoOriginal: "Plátano macho",
      especificacionIa: null,
      especificacionEnvase: "",
      unidadOrigen: "PZ",
      unidadCatalogo: "KGM",
    });
    expect(r.unidadMedida).toBe("KGM");
    expect(r.especificacion).toBe("Pedido en PZA");
  });

  it("misma familia no añade Pedido en …", () => {
    const r = unidadYEspecificacionLineaForm({
      textoOriginal: "Jitomate",
      especificacionIa: "Fresco",
      especificacionEnvase: "",
      unidadOrigen: "KG",
      unidadCatalogo: "KGM",
    });
    expect(r.unidadMedida).toBe("KGM");
    expect(r.especificacion).toBe("Fresco");
  });
});
