import { describe, expect, it } from "vitest";
import { buildAuthContextFromSession } from "@/lib/auth-context";
import type { AuthSession } from "@/types/auth";
import {
  createEmptyTenantContext,
  createMinimalAuthContext,
} from "@/types/auth";

const tenantSession: AuthSession = {
  idUsuario: "user-1",
  idAuth: "auth-1",
  nombre: "Operador",
  username: "operador.acme",
  correo: "operador@acme.com",
  idRol: "operador",
  nombreRol: "Operador",
  nivelRol: "bodega",
  codigoEmpresa: "ACME",
  razonSocialEmpresa: "ACME Corp",
  codigoCuenta: "CUENTA-01",
  nombreComercialCuenta: "ACME Norte",
  idBodegas: ["BOD-01", "BOD-02"],
  scope: "tenant",
};

describe("auth tenant types", () => {
  it("createEmptyTenantContext devuelve valores vacíos", () => {
    expect(createEmptyTenantContext()).toEqual({
      codigoEmpresa: null,
      codigoCuenta: null,
      idBodegas: [],
      nivelRol: "platform",
    });
  });

  it("createMinimalAuthContext conserva el scope", () => {
    expect(createMinimalAuthContext("tenant")).toMatchObject({
      scope: "tenant",
      idBodegas: [],
    });
  });

  it("buildAuthContextFromSession propaga contexto tenant completo", () => {
    expect(buildAuthContextFromSession(tenantSession)).toEqual({
      scope: "tenant",
      codigoEmpresa: "ACME",
      codigoCuenta: "CUENTA-01",
      idBodegas: ["BOD-01", "BOD-02"],
      nivelRol: "bodega",
    });
  });
});
