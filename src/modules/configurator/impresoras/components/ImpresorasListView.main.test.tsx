import { describe, expect, it } from "vitest";
import * as barrel from "./ImpresorasListView";
import * as part from "./ImpresorasListView.main";

describe("ImpresorasListView.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.ImpresorasListView).toBe(part.ImpresorasListView);
  });
});
