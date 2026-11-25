import { describe, expect, it } from "vitest";
import { ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES } from "./draw-orden-tarea-almacen-signature-roles";

describe("ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES", () => {
  it("define los cinco roles esperados", () => {
    expect(ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES.map((r) => r.role)).toEqual([
      "Alistó",
      "Revisó",
      "Documentación",
      "Despachó",
      "Retorno",
    ]);
  });
});