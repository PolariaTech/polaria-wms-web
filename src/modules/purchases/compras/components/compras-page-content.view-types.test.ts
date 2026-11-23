import { describe, expectTypeOf, it } from "vitest";
import type { ComprasTab } from "./compras-page-content.view-types";

describe("compras-page-content.view-types", () => {
  it("ComprasTab admite solicitudes y ordenes", () => {
    expectTypeOf<ComprasTab>().toEqualTypeOf<"solicitudes" | "ordenes">();
  });
});
