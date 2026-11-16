import { afterEach, describe, expect, it, vi } from "vitest";
import { newToastId } from "./new-toast-id";

describe("newToastId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa crypto.randomUUID cuando existe", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "11111111-2222-3333-4444-555555555555",
    });
    expect(newToastId()).toBe("11111111-2222-3333-4444-555555555555");
  });

  it("no lanza si randomUUID no existe", () => {
    vi.stubGlobal("crypto", {});
    const id = newToastId();
    expect(id.startsWith("toast-")).toBe(true);
    expect(id.length).toBeGreaterThan(10);
  });
});
