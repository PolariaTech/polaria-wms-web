import { afterEach, describe, expect, it } from "vitest";
import {
  forceResetBodyScrollLock,
  getBodyScrollLockCountForTests,
  lockBodyScroll,
  unlockBodyScroll,
} from "@/lib/utils/body-scroll-lock";

describe("body-scroll-lock", () => {
  afterEach(() => {
    forceResetBodyScrollLock();
  });

  it("bloquea y libera el overflow del body", () => {
    expect(document.body.style.overflow).toBe("");
    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
    expect(getBodyScrollLockCountForTests()).toBe(0);
  });

  it("con locks anidados solo libera al cerrar el último", () => {
    lockBodyScroll();
    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    expect(getBodyScrollLockCountForTests()).toBe(2);

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    expect(getBodyScrollLockCountForTests()).toBe(1);

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
    expect(getBodyScrollLockCountForTests()).toBe(0);
  });

  it("no deja hidden si el hijo se cierra después del padre (regresión Cypher+confirm)", () => {
    // Padre (Cypher)
    lockBodyScroll();
    // Hijo (confirm)
    lockBodyScroll();
    // Padre se desmonta primero
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    // Hijo se desmonta después
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
  });
});
