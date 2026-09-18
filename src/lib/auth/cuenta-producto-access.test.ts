import { describe, expect, it } from "vitest";
import {
  accesoProductoFromFlags,
  flagsFromAccesoProducto,
  sessionHasMateoAccess,
  sessionHasWmsAccess,
  sessionIsMateoOnly,
} from "./cuenta-producto-access";

describe("cuenta-producto-access", () => {
  it("mapea flags a producto y de vuelta", () => {
    expect(accesoProductoFromFlags(true, true)).toBe("ambos");
    expect(accesoProductoFromFlags(true, false)).toBe("wms");
    expect(accesoProductoFromFlags(false, true)).toBe("mateo");
    expect(flagsFromAccesoProducto("ambos")).toEqual({
      accesoWms: true,
      accesoMateo: true,
    });
    expect(flagsFromAccesoProducto("wms")).toEqual({
      accesoWms: true,
      accesoMateo: false,
    });
    expect(flagsFromAccesoProducto("mateo")).toEqual({
      accesoWms: false,
      accesoMateo: true,
    });
  });

  it("plataforma siempre tiene WMS y Mateo", () => {
    expect(sessionHasWmsAccess({ scope: "platform" })).toBe(true);
    expect(sessionHasMateoAccess({ scope: "platform" })).toBe(true);
    expect(sessionIsMateoOnly({ scope: "platform" })).toBe(false);
  });

  it("tenant sin flags conserva el comportamiento actual", () => {
    expect(sessionHasWmsAccess({ scope: "tenant" })).toBe(true);
    expect(sessionHasMateoAccess({ scope: "tenant" })).toBe(true);
    expect(sessionIsMateoOnly({ scope: "tenant" })).toBe(false);
  });

  it("detecta solo Mateo IA", () => {
    expect(
      sessionIsMateoOnly({
        scope: "tenant",
        accesoWms: false,
        accesoMateo: true,
      }),
    ).toBe(true);
    expect(
      sessionHasMateoAccess({
        scope: "tenant",
        accesoMateo: false,
      }),
    ).toBe(false);
  });
});
