import { afterEach, describe, expect, it } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import {
  fetchPreciosProductoMap,
  fetchPreciosUnitariosProductos,
  fetchUltimosPreciosPorComprador,
} from "./sales-precios-venta";

describe("sales-precios-venta", () => {
  afterEach(() => {
    setSupabaseClientForTests(null);
  });

  it("devuelve vacío sin consultar cuando no hay ids", async () => {
    expect((await fetchPreciosProductoMap("CTA", [])).size).toBe(0);
    expect((await fetchPreciosUnitariosProductos("CTA", [" "])).size).toBe(0);
    expect(
      await fetchUltimosPreciosPorComprador({
        codigoCuenta: "CTA",
        idComprador: "  ",
      }),
    ).toEqual({});
  });
});
