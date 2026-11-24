import { describe, expect, it } from "vitest";
import { CompradoresListView } from "./compradores-list-view.body";

describe("compradores-list-view.body smoke", () => {
  it("exporta CompradoresListView", () => {
    expect(typeof CompradoresListView).toBe("function");
  });
});