import { describe, expect, it } from "vitest";
import { ORDEN_VENTA_DETALLE_FLAT_COLUMNS } from "./orden-venta-detalle-columns";

describe("ORDEN_VENTA_DETALLE_FLAT_COLUMNS (REQ-251)", () => {
  it("incluye coordenadas de entrega", () => {
    expect(ORDEN_VENTA_DETALLE_FLAT_COLUMNS).toContain("entrega_lat");
    expect(ORDEN_VENTA_DETALLE_FLAT_COLUMNS).toContain("entrega_lng");
    expect(ORDEN_VENTA_DETALLE_FLAT_COLUMNS).toContain("direccion_entrega");
  });
});
