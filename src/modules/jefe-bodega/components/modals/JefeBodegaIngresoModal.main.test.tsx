import { describe, expect, it } from "vitest";
import * as barrel from "./JefeBodegaIngresoModal";
import * as part from "./JefeBodegaIngresoModal.main";

describe("JefeBodegaIngresoModal.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.JefeBodegaIngresoModal).toBe(part.JefeBodegaIngresoModal);
  });
});
