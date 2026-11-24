import { describe, expect, it } from "vitest";
import {
  getEstadoBodegaLayout,
  listUbicacionesEstadoBodega,
} from "./estado-bodega.service";

describe("estado-bodega.service", () => {
  it("exporta listado y layout", () => {
    expect(typeof listUbicacionesEstadoBodega).toBe("function");
    expect(typeof getEstadoBodegaLayout).toBe("function");
  });
});
