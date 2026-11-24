import { describe, expect, it } from "vitest";
import {
  approx,
  ENVASE_RE,
  ENVASE_SIN_N_RE,
  familiaDesdeToken,
  familiaUnidadCatalogo,
  normalizarContenido,
  parseNum,
  quitarAcentos,
  roundQty,
} from "./resolve-cantidad-envase-unidades";

describe("resolve-cantidad-envase-unidades", () => {
  it("normaliza texto, números decimales y redondeo", () => {
    expect(quitarAcentos("Galón de 5 Litros")).toBe("galon de 5 litros");
    expect(parseNum("2,5")).toBe(2.5);
    expect(parseNum("0")).toBeNull();
    expect(roundQty(70 / 3)).toBe(23.333);
    expect(approx(5.02, 5)).toBe(true);
    expect(approx(5.2, 5)).toBe(false);
  });

  it("clasifica unidades de catálogo y tokens de contenido por familia", () => {
    expect(familiaUnidadCatalogo("LTR")).toBe("ltr");
    expect(familiaUnidadCatalogo("KGM")).toBe("kg");
    expect(familiaUnidadCatalogo("CJA")).toBe("pza");
    expect(familiaUnidadCatalogo("bulto")).toBe("unknown");
    expect(familiaDesdeToken("ml")).toBe("ltr");
    expect(familiaDesdeToken("grs.")).toBe("kg");
    expect(familiaDesdeToken("pzas")).toBe("pza");
  });

  it("convierte ml a litros y gramos a kilos en normalizarContenido", () => {
    expect(normalizarContenido(500, "ml")).toEqual({ valor: 0.5, familia: "ltr" });
    expect(normalizarContenido(750, "g")).toEqual({ valor: 0.75, familia: "kg" });
    expect(normalizarContenido(5, "litros")).toEqual({ valor: 5, familia: "ltr" });
  });

  it("matchea expresiones de envase con y sin cantidad inicial", () => {
    const conN = ENVASE_RE.exec(quitarAcentos("2 galones de 5 litros"));
    expect(conN?.[1]).toBe("2");
    expect(conN?.[3]).toBe("5");
    expect(conN?.[4]).toBe("litros");

    const sinN = ENVASE_SIN_N_RE.exec(quitarAcentos("cubeta de 19 kg"));
    expect(sinN?.[1]).toBe("cubeta");
    expect(sinN?.[2]).toBe("19");
    expect(sinN?.[3]).toBe("kg");
  });
});
