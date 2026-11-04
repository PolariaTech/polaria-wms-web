import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRefsOv } from "./useRefsOv";

describe("useRefsOv", () => {
  it("entrega las 12 refs del modal con los mismos valores iniciales de antes", () => {
    const { result } = renderHook(() => useRefsOv());
    const r = result.current;

    expect(Object.keys(r).sort()).toEqual(
      [
        "bootstrapPromiseRef",
        "docsFileInputRef",
        "formScrollRef",
        "formScrollTopRef",
        "pendingDraftSaveAfterReorgRef",
        "revisionFocusRequestRef",
        "seededOtIdsRef",
        "selectedCompradorIdRef",
        "skipDiscrepanciaConfirmRef",
        "skipOtSeedFromOrigenRef",
        "skipSaveConfirmRef",
        "submitIntentRef",
      ].sort(),
    );
    expect(r.selectedCompradorIdRef.current).toBe("");
    expect(r.skipDiscrepanciaConfirmRef.current).toBe(false);
    expect(r.skipSaveConfirmRef.current).toBe(false);
    expect(r.submitIntentRef.current).toBe("emit");
    expect(r.docsFileInputRef.current).toBeNull();
    expect(r.bootstrapPromiseRef.current).toBeNull();
    expect(r.seededOtIdsRef.current).toEqual(new Set());
    expect(r.skipOtSeedFromOrigenRef.current).toBe(false);
    expect(r.pendingDraftSaveAfterReorgRef.current).toBe(false);
    expect(r.formScrollRef.current).toBeNull();
    expect(r.formScrollTopRef.current).toBeNull();
    expect(r.revisionFocusRequestRef.current).toBeNull();
  });

  it("las refs son las mismas entre renders y conservan lo que se les escribe", () => {
    const { result, rerender } = renderHook(() => useRefsOv());
    const antes = result.current;

    antes.submitIntentRef.current = "draft";
    antes.seededOtIdsRef.current.add("ot-1");
    rerender();

    expect(result.current.submitIntentRef).toBe(antes.submitIntentRef);
    expect(result.current.submitIntentRef.current).toBe("draft");
    expect(result.current.seededOtIdsRef).toBe(antes.seededOtIdsRef);
    expect(result.current.seededOtIdsRef.current.has("ot-1")).toBe(true);
  });

  it("cada instancia del modal tiene sus propias refs", () => {
    const a = renderHook(() => useRefsOv());
    const b = renderHook(() => useRefsOv());

    a.result.current.submitIntentRef.current = "draft";

    expect(b.result.current.submitIntentRef.current).toBe("emit");
    expect(b.result.current.seededOtIdsRef).not.toBe(a.result.current.seededOtIdsRef);
  });
});
