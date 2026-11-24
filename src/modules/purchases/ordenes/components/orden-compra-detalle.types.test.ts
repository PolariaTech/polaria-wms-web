import { describe, expect, expectTypeOf, it } from "vitest";
import {
  DESTINO_TIPO_OPTIONS,
  type OrdenCompraDestinoPatch,
} from "./orden-compra-detalle.types";

describe("orden-compra-detalle.types", () => {
  it("expone opciones de destino interna y externa", () => {
    expect(DESTINO_TIPO_OPTIONS.map((option) => option.value)).toEqual([
      "interna",
      "externa",
    ]);
  });

  it("OrdenCompraDestinoPatch tiene campos opcionales", () => {
    expectTypeOf<OrdenCompraDestinoPatch>().toMatchTypeOf<{
      idBodega?: string;
    }>();
  });
});
