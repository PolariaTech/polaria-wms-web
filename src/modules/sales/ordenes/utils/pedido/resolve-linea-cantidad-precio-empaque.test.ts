import { describe, expect, it } from "vitest";
import { resolveLineaCantidadPrecioEmpaque } from "./resolve-linea-cantidad-precio-empaque";

describe("resolveLineaCantidadPrecioEmpaque (REQ-311)", () => {
  it("convierte 8 PZ de galón 5 L a 40 LTR usando especificación IA", () => {
    const resolved = resolveLineaCantidadPrecioEmpaque({
      textoOriginal: "JUGO DE LIMON fresco",
      especificacionIa: "galón de 5 litros",
      unidadMedidaCatalogo: "LTR",
      cantidad: 8,
      cajas: null,
      presentacion: "",
      precioDoc: 350,
      precioCatalogo: 70,
    });
    expect(resolved.cantidadInput).toBe("40");
    expect(resolved.precioUnitario).toBe(70);
    expect(resolved.especificacionEnvase).toBe("8x galón de 5 litros");
  });

  it("sin envase deja la cantidad del documento", () => {
    const resolved = resolveLineaCantidadPrecioEmpaque({
      textoOriginal: "AJO limpio",
      unidadMedidaCatalogo: "KGM",
      cantidad: 6,
      cajas: null,
      presentacion: "",
      precioDoc: null,
      precioCatalogo: 40,
    });
    expect(resolved.cantidadInput).toBe("6");
    expect(resolved.especificacionEnvase).toBe("");
  });
});
