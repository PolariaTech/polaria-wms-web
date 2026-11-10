import { describe, expect, it } from "vitest";

describe("useOvEditLockSession (REQ-180)", () => {
  it("exporta el hook de sesión de soft-lock", async () => {
    const mod = await import("./use-ov-edit-lock-session");
    expect(typeof mod.useOvEditLockSession).toBe("function");
  });
});
