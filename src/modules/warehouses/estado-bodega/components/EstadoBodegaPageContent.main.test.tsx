import { describe, expect, it } from "vitest";
import * as barrel from "./EstadoBodegaPageContent";
import * as part from "./EstadoBodegaPageContent.main";

describe("EstadoBodegaPageContent.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.EstadoBodegaPageContent).toBe(part.EstadoBodegaPageContent);
  });
});
