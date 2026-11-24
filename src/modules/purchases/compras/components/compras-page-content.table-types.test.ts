import { describe, expectTypeOf, it } from "vitest";
import type { ComprasPageTableCtx } from "./compras-page-content.table-types";

describe("compras-page-content.table-types", () => {
  it("define el contexto de tablas", () => {
    expectTypeOf<ComprasPageTableCtx["puedeAprobarSolicitud"]>().toBeBoolean();
    expectTypeOf<ComprasPageTableCtx["notifiedOrdenIds"]>().toEqualTypeOf<
      Set<string>
    >();
  });
});
