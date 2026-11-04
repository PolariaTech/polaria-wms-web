import { describe, expect, it } from "vitest";
import {
  resolveCreateCypherTarget,
  shouldClearCypherOnCreateClose,
} from "./ov-create-draft-session";

describe("ov-create-draft-session (REQ-199)", () => {
  it("prioriza editingId sobre createDraftId", () => {
    expect(resolveCreateCypherTarget("edit", "draft")).toBe("edit");
    expect(resolveCreateCypherTarget(null, "draft")).toBe("draft");
  });

  it("limpia Cypher solo si coincide con el id que cierra", () => {
    expect(
      shouldClearCypherOnCreateClose({ cypherId: "a", closingId: "a" }),
    ).toBe(true);
    expect(
      shouldClearCypherOnCreateClose({ cypherId: "a", closingId: "b" }),
    ).toBe(false);
  });
});
