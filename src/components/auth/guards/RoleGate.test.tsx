import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSION } from "@/constants/wms/permissions";
import { WmsRol } from "@/constants/wms/roles";
import type { AuthSession } from "@/types/auth/auth";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: { session: AuthSession | null }) => unknown,
  ) => selector({ session: mockSession }),
}));

let mockSession: AuthSession | null = null;

import { RoleGate } from "./RoleGate";

const operarioSession: AuthSession = {
  idUsuario: "user-1",
  idAuth: "auth-1",
  nombre: "Operario",
  username: "operario.acme",
  correo: "operario@acme.com",
  idRol: WmsRol.operario,
  nombreRol: "Operario",
  nivelRol: "bodega",
  codigoEmpresa: "ACME",
  razonSocialEmpresa: "ACME Corp",
  codigoCuenta: null,
  nombreComercialCuenta: null,
  idBodegas: ["BOD-01"],
  scope: "tenant",
};

describe("RoleGate", () => {
  beforeEach(() => {
    mockSession = null;
  });

  it("renderiza children cuando el permiso se cumple", () => {
    mockSession = {
      ...operarioSession,
      idRol: WmsRol.jefe_bodega,
    };

    render(
      <RoleGate permission={PERMISSION.INVENTORY_WRITE}>
        <span>panel inventario</span>
      </RoleGate>,
    );

    expect(screen.getByText("panel inventario")).toBeInTheDocument();
  });

  it("muestra fallback cuando el permiso no se cumple", () => {
    mockSession = operarioSession;

    render(
      <RoleGate
        permission={PERMISSION.INVENTORY_WRITE}
        fallback={<span>sin acceso</span>}
      >
        <span>panel inventario</span>
      </RoleGate>,
    );

    expect(screen.queryByText("panel inventario")).not.toBeInTheDocument();
    expect(screen.getByText("sin acceso")).toBeInTheDocument();
  });

  it("permite por idRol específico", () => {
    mockSession = operarioSession;

    render(
      <RoleGate idRol={WmsRol.operario}>
        <span>vista operario</span>
      </RoleGate>,
    );

    expect(screen.getByText("vista operario")).toBeInTheDocument();
  });

  it("permite por minNivelRol", () => {
    mockSession = {
      ...operarioSession,
      nivelRol: "cuenta",
    };

    render(
      <RoleGate minNivelRol="bodega">
        <span>vista cuenta</span>
      </RoleGate>,
    );

    expect(screen.getByText("vista cuenta")).toBeInTheDocument();
  });

  it("muestra fallback sin sesión", () => {
    render(
      <RoleGate
        permission={PERMISSION.INVENTORY_READ}
        fallback={<span>inicia sesión</span>}
      >
        <span>contenido</span>
      </RoleGate>,
    );

    expect(screen.getByText("inicia sesión")).toBeInTheDocument();
  });
});
