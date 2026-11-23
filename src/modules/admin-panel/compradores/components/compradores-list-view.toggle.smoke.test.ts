import { describe, expect, it } from "vitest";
import { useCompradoresListToggleHandler } from "./compradores-list-view.toggle";

describe("compradores-list-view.toggle smoke", () => {
  it("expone el hook de toggle", () => {
    expect(typeof useCompradoresListToggleHandler).toBe("function");
  });
});