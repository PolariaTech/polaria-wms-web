import { describe, expect, it } from "vitest";
import type { AccionModal } from "./accion-modal";

describe("AccionModal", () => {
  it("acepta un callback genérico", () => {
    const fn: AccionModal = (...args) => args.length;
    expect(fn(1, 2)).toBe(2);
  });
});
