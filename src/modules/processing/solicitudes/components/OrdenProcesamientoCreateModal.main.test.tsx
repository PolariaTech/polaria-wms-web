import { describe, expect, it } from "vitest";
import * as barrel from "./OrdenProcesamientoCreateModal";
import * as part from "./OrdenProcesamientoCreateModal.main";

describe("OrdenProcesamientoCreateModal.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.OrdenProcesamientoCreateModal).toBe(part.OrdenProcesamientoCreateModal);
  });
});
