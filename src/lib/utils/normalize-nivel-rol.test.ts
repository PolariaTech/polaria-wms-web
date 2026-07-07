import { describe, expect, it } from "vitest";
import {
  normalizeAuthSession,
  normalizeNivelRol,
} from "@/lib/utils/normalize-nivel-rol";
import type { AuthSession } from "@/types/auth/auth";

const baseSession: AuthSession = {
  idUsuario: "user-1",
  idAuth: "auth-1",
  nombre: "Admin",
  username: "admin.acme",
  correo: "admin@acme.com",
  idRol: "administrador_bodega",
  nombreRol: "Administrador de bodega",
  nivelRol: "bodega",
  codigoEmpresa: "ACME",
  razonSocialEmpresa: "ACME Corp",
  codigoCuenta: null,
  nombreComercialCuenta: null,
  idBodegas: ["BOD-01"],
  scope: "tenant",
};

describe("normalizeNivelRol", () => {
  it("mapea plataforma del API a platform web", () => {
    expect(normalizeNivelRol("plataforma")).toBe("platform");
  });

  it("conserva valores ya normalizados", () => {
    expect(normalizeNivelRol("platform")).toBe("platform");
    expect(normalizeNivelRol("empresa")).toBe("empresa");
    expect(normalizeNivelRol("cuenta")).toBe("cuenta");
    expect(normalizeNivelRol("bodega")).toBe("bodega");
  });
});

describe("normalizeAuthSession", () => {
  it("normaliza nivelRol en la sesión completa", () => {
    expect(
      normalizeAuthSession({ ...baseSession, nivelRol: "plataforma" as never })
        .nivelRol,
    ).toBe("platform");
  });

  it("no altera otros campos de la sesión", () => {
    const normalized = normalizeAuthSession(baseSession);
    expect(normalized.idUsuario).toBe(baseSession.idUsuario);
    expect(normalized.scope).toBe("tenant");
    expect(normalized.nivelRol).toBe("bodega");
  });
});
