import { describe, expect, it } from "vitest";
import * as barrel from "./PolariaDataTable";
import * as part from "./PolariaDataTableView";

describe("PolariaDataTableView", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.PolariaDataTable).toBe(part.PolariaDataTable);
  });
});
