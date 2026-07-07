import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSION, WMS_MODULE } from "@/constants/wms/permissions";
import { WmsRol } from "@/constants/wms/roles";
import type { AuthSession } from "@/types/auth/auth";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: { session: AuthSession | null }) => unknown,
  ) => selector({ session: mockSession }),
}));

let mockSession: AuthSession | null = null;

import { usePermissions } from "./usePermissions";

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

const jefeSession: AuthSession = {
  ...operarioSession,
  idRol: WmsRol.jefe_bodega,
  nombreRol: "Jefe de bodega",
};

const configuradorSession: AuthSession = {
  ...operarioSession,
  idRol: WmsRol.configurador,
  nombreRol: "Configurador",
  nivelRol: "platform",
  codigoEmpresa: null,
  razonSocialEmpresa: null,
  scope: "platform",
};

describe("usePermissions", () => {
  beforeEach(() => {
    mockSession = null;
  });

  it("expone idRol y nivelRol de la sesión", () => {
    mockSession = operarioSession;

    const { result } = renderHook(() => usePermissions());

    expect(result.current.idRol).toBe(WmsRol.operario);
    expect(result.current.nivelRol).toBe("bodega");
  });

  it("deniega permisos sin sesión", () => {
    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission(PERMISSION.INVENTORY_WRITE)).toBe(
      false,
    );
    expect(result.current.canAccessModule(WMS_MODULE.INVENTORY)).toBe(false);
  });

  it("operario puede leer inventario pero no escribir", () => {
    mockSession = operarioSession;

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission(PERMISSION.INVENTORY_READ)).toBe(true);
    expect(result.current.hasPermission(PERMISSION.INVENTORY_WRITE)).toBe(
      false,
    );
  });

  it("jefe de bodega puede escribir inventario", () => {
    mockSession = jefeSession;

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission(PERMISSION.INVENTORY_WRITE)).toBe(true);
  });

  it("configurador accede al módulo configurador y tiene todos los permisos", () => {
    mockSession = configuradorSession;

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccessModule(WMS_MODULE.CONFIGURATOR)).toBe(true);
    expect(result.current.hasPermission(PERMISSION.COUNTERS_WRITE)).toBe(true);
  });

  it("operario no accede al módulo configurador", () => {
    mockSession = operarioSession;

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccessModule(WMS_MODULE.CONFIGURATOR)).toBe(false);
    expect(result.current.canAccessModule(WMS_MODULE.INVENTORY)).toBe(true);
  });
});
