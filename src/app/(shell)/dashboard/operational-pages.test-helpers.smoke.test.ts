import { describe, expect, it } from "vitest";
import * as helpers from "./operational-pages.test-helpers";

describe("operational-pages.test-helpers", () => {
  it("exporta fixtures compartidas", () => {
    expect(helpers.baseSession).toBeDefined();
    expect(helpers.authTestState).toBeDefined();
  });
});
