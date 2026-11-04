import { describe, expect, it } from "vitest";
import { MODAL_SIZE_CLASS, MODAL_STACK_CLASS } from "./polaria-form-modal-layout";

describe("polaria-form-modal-layout", () => {
  it("expone tamaños y stacks conocidos", () => {
    expect(MODAL_SIZE_CLASS.xl).toBe("max-w-4xl");
    expect(MODAL_STACK_CLASS.base).toBe("z-[100]");
  });
});
