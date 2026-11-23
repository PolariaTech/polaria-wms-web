import { describe, expect, it } from "vitest";
import * as barrel from "./JefeBodegaSalidaModal";
import * as part from "./JefeBodegaSalidaModal.main";

describe("JefeBodegaSalidaModal.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.JefeBodegaSalidaModal).toBe(part.JefeBodegaSalidaModal);
  });
});
