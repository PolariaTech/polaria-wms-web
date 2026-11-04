import { describe, expect, it } from "vitest";
import {
  cypherMatchesCreateDraft,
  OV_LISTADO_DATATABLE_CHROME_CLASS,
} from "./ov-listado-chrome";

describe("ov-listado-chrome (REQ-199/226)", () => {
  it("expone la clase de chrome del listado", () => {
    expect(OV_LISTADO_DATATABLE_CHROME_CLASS).toContain("justify-end");
  });

  it("abre Cypher con createDraftId sin editingId", () => {
    expect(
      cypherMatchesCreateDraft({
        cypherId: "ov-1",
        editingId: null,
        createDraftId: "ov-1",
      }),
    ).toBe(true);
  });
});
