import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/lib/auth/auth-routes";

describe("auth-routes", () => {
  it("detecta rutas protegidas del shell", () => {
    expect(isProtectedPath("/configurador")).toBe(true);
    expect(isProtectedPath("/configurador/foo")).toBe(true);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/platform")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/auth/sso")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });
});
