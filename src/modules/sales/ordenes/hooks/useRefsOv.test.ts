import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRefsOv } from "./useRefsOv";

describe("useRefsOv", () => {
  it("entrega las 12 refs del modal con los mismos valores iniciales de antes", () => {
    const { result } = renderHook(() => useRefsOv());
    const refs = result.current;

    expect(Object.keys(refs).sort()).toEqual(
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
    expect(refs.selectedCompradorIdRef.current).toBe("");
    expect(refs.skipDiscrepanciaConfirmRef.current).toBe(false);
    expect(refs.skipSaveConfirmRef.current).toBe(false);
    expect(refs.submitIntentRef.current).toBe("emit");
    expect(refs.docsFileInputRef.current).toBeNull();
    expect(refs.bootstrapPromiseRef.current).toBeNull();
    expect(refs.seededOtIdsRef.current).toEqual(new Set());
    expect(refs.skipOtSeedFromOrigenRef.current).toBe(false);
    expect(refs.pendingDraftSaveAfterReorgRef.current).toBe(false);
    expect(refs.formScrollRef.current).toBeNull();
    expect(refs.formScrollTopRef.current).toBeNull();
    expect(refs.revisionFocusRequestRef.current).toBeNull();
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
    const primeraInstancia = renderHook(() => useRefsOv());
    const segundaInstancia = renderHook(() => useRefsOv());

    primeraInstancia.result.current.submitIntentRef.current = "draft";

    expect(segundaInstancia.result.current.submitIntentRef.current).toBe("emit");
    expect(segundaInstancia.result.current.seededOtIdsRef).not.toBe(
      primeraInstancia.result.current.seededOtIdsRef,
    );
  });
});
