import { describe, expect, it } from "vitest";
import { isCapturaOrdenPath, isProtectedPath } from "@/lib/auth/auth-routes";

describe("auth-routes", () => {
  it("detecta rutas protegidas del shell", () => {
    expect(isProtectedPath("/configurador")).toBe(true);
    expect(isProtectedPath("/configurador/foo")).toBe(true);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/platform")).toBe(true);
    expect(isProtectedPath("/perfil")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/auth/sso")).toBe(false);
    expect(isProtectedPath("/captura-orden/abc")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });

  it("detecta la captura pública del QR", () => {
    expect(isCapturaOrdenPath("/captura-orden")).toBe(true);
    expect(isCapturaOrdenPath("/captura-orden/ov-1")).toBe(true);
    expect(isCapturaOrdenPath("/dashboard")).toBe(false);
  });
});
