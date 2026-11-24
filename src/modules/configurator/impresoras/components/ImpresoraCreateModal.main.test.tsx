import { describe, expect, it } from "vitest";
import * as barrel from "./ImpresoraCreateModal";
import * as part from "./ImpresoraCreateModal.main";

describe("ImpresoraCreateModal.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.ImpresoraCreateModal).toBe(part.ImpresoraCreateModal);
  });
});
