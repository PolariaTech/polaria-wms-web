import { describe, expect, it } from "vitest";
import * as barrel from "./JefeBodegaTransferenciaModal";
import * as part from "./JefeBodegaTransferenciaModal.main";

describe("JefeBodegaTransferenciaModal.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.JefeBodegaTransferenciaModal).toBe(part.JefeBodegaTransferenciaModal);
  });
});
