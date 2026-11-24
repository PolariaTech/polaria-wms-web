import { describe, expect, it } from "vitest";
import * as helpers from "./estado-bodega-zone-operativo.test-helpers";

describe("estado-bodega-zone-operativo.test-helpers", () => {
  it("exporta fixtures compartidas", () => {
    expect(helpers.tarea).toBeDefined();
  });
});
