import { describe, expect, it } from "vitest";
import {
  familiaUnidadCatalogo,
  formatEspecificacionEnvase,
  parseEnvaseContenidoDesdeTexto,
  resolveCantidadPrecioDesdeEnvase,
  resolveEspecificacionPedidoLinea,
} from "./resolve-cantidad-envase";

describe("familiaUnidadCatalogo", () => {
  it("normaliza LTR/KGM/PZA", () => {
    expect(familiaUnidadCatalogo("LTR")).toBe("ltr");
    expect(familiaUnidadCatalogo("KGM")).toBe("kg");
    expect(familiaUnidadCatalogo("PZA")).toBe("pza");
    expect(familiaUnidadCatalogo("kg")).toBe("kg");
  });
});

describe("parseEnvaseContenidoDesdeTexto", () => {
  it("lee 1 galón de 5 litros", () => {
    expect(
      parseEnvaseContenidoDesdeTexto("Jugo de Limón fresco galón de 5 litros"),
    ).toMatchObject({
      envases: 1,
      contenidoPorEnvase: 5,
      familiaContenido: "ltr",
    });
  });

  it("lee 2 cubetas de 10 litros", () => {
    expect(
      parseEnvaseContenidoDesdeTexto(
        "Jugo de naranja fresco cubeta de 10 litros",
      ),
    ).toMatchObject({
      envases: 1,
      contenidoPorEnvase: 10,
      familiaContenido: "ltr",
    });
  });

  it("lee N cajas de X kg", () => {
    expect(parseEnvaseContenidoDesdeTexto("15 cajas de 20 kg")).toMatchObject({
      envases: 15,
      contenidoPorEnvase: 20,
      familiaContenido: "kg",
    });
  });
});

describe("resolveCantidadPrecioDesdeEnvase", () => {
  it("1 galón de 5 L + LTR + precio 350 → 5 LTR @ 70", () => {
    expect(
      resolveCantidadPrecioDesdeEnvase({
        textoOriginal: "Jugo de Limón fresco galón de 5 litros",
        unidadMedidaCatalogo: "LTR",
        cantidadRaw: 1,
        precioDoc: 350,
      }),
    ).toMatchObject({
      cantidad: 5,
      precioUnitario: 70,
      envases: 1,
      contenidoPorEnvase: 5,
    });
  });

  it("2 cubetas de 10 L (cantidad 2) + LTR + 720 → 20 @ 72", () => {
    expect(
      resolveCantidadPrecioDesdeEnvase({
        textoOriginal: "Jugo de naranja fresco cubeta de 10 litros",
        unidadMedidaCatalogo: "LTR",
        cantidadRaw: 2,
        precioDoc: 720,
      }),
    ).toMatchObject({
      cantidad: 20,
      precioUnitario: 72,
      envases: 2,
      contenidoPorEnvase: 10,
    });
  });

  it("no toca si ya está convertido (5 LTR @ 70)", () => {
    expect(
      resolveCantidadPrecioDesdeEnvase({
        textoOriginal: "galón de 5 litros",
        unidadMedidaCatalogo: "LTR",
        cantidadRaw: 5,
        precioDoc: 70,
      }),
    ).toBeNull();
  });

  it("no convierte si el catálogo es PZA", () => {
    expect(
      resolveCantidadPrecioDesdeEnvase({
        textoOriginal: "1 galón de 5 litros",
        unidadMedidaCatalogo: "PZA",
        cantidadRaw: 1,
        precioDoc: 350,
      }),
    ).toBeNull();
  });

  it("cajas de kg → KGM", () => {
    expect(
      resolveCantidadPrecioDesdeEnvase({
        textoOriginal: "pedido de 3 cajas de 20 kg aguacate",
        unidadMedidaCatalogo: "KGM",
        cantidadRaw: 3,
        precioDoc: 600,
      }),
    ).toMatchObject({
      cantidad: 60,
      precioUnitario: 30,
    });
  });
});

describe("formatEspecificacionEnvase / resolveEspecificacionPedidoLinea", () => {
  it("formatea 2x galón de 5 litros", () => {
    const converted = resolveCantidadPrecioDesdeEnvase({
      textoOriginal: "Jugo de Limón fresco galón de 5 litros",
      unidadMedidaCatalogo: "LTR",
      cantidadRaw: 2,
      precioDoc: 700,
    });
    expect(converted).not.toBeNull();
    expect(formatEspecificacionEnvase(converted!)).toBe("2x galón de 5 litros");
  });

  it("prioriza envase sobre especificación IA", () => {
    const converted = resolveCantidadPrecioDesdeEnvase({
      textoOriginal: "cubeta de 10 litros",
      unidadMedidaCatalogo: "LTR",
      cantidadRaw: 1,
      precioDoc: 720,
    });
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "1x cubeta d",
        envase: converted,
      }),
    ).toBe("1x cubeta de 10 litros");
  });

  it("usa IA si no hay envase", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "sin penacho",
        envase: null,
      }),
    ).toBe("sin penacho");
  });

  it("REQ-120: madurez desde texto → especificación", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        envase: null,
        textoOriginal: "AGUACATE HASS madurez: amarillo",
      }),
    ).toBe("Amarillo");
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        envase: null,
        textoOriginal: "firme",
      }),
    ).toBe("Firme");
  });
});
