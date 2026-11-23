import { describe, expect, it } from "vitest";
import * as helpers from "./estado-bodega-procesamiento-slot.test-helpers";

describe("estado-bodega-procesamiento-slot.test-helpers", () => {
  it("exporta fixtures compartidas", () => {
    expect(helpers.baseLayout).toBeDefined();
  });
});
