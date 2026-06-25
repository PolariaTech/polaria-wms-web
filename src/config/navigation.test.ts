import { describe, expect, it } from "vitest";
import { PERMISSION } from "@/constants/permissions";
import { WmsRol } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import {
  filterNavItems,
  getNavItemsForScope,
  isNavItemActive,
  PLATFORM_NAV,
  TENANT_NAV,
} from "./navigation";

const tenantContext = (idRol: string, nivelRol: "bodega" | "cuenta" | "empresa") => ({
  scope: "tenant" as const,
  idRol,
  nivelRol,
});

describe("getNavItemsForScope", () => {
  it("devuelve PLATFORM_NAV para scope platform", () => {
    expect(getNavItemsForScope("platform")).toBe(PLATFORM_NAV);
  });

  it("devuelve TENANT_NAV para scope tenant", () => {
    expect(getNavItemsForScope("tenant")).toBe(TENANT_NAV);
  });
});

describe("isNavItemActive", () => {
  it("coincide exacto en rutas raíz", () => {
    expect(isNavItemActive("/dashboard", ROUTES.dashboard)).toBe(true);
    expect(isNavItemActive("/dashboard/ingreso", ROUTES.dashboard)).toBe(false);
  });

  it("coincide prefijo en subrutas", () => {
    expect(isNavItemActive("/dashboard/mapa", ROUTES.dashboardMapa)).toBe(true);
    expect(isNavItemActive("/dashboard/mapa/detalle", ROUTES.dashboardMapa)).toBe(
      true,
    );
  });
});

describe("filterNavItems", () => {
  it("operario ve mapa e ingreso pero no reportería", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.operario, "bodega"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Inicio");
    expect(labels).toContain("Mapa");
    expect(labels).toContain("Ingreso");
    expect(labels).not.toContain("Reportería");
  });

  it("transportista solo ve inicio y transporte", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.transportista, "bodega"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toEqual(["Inicio", "Ingreso", "Transporte"]);
  });

  it("procesador ve inicio, ingreso y procesamiento", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.procesador, "bodega"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Procesamiento");
    expect(labels).not.toContain("Mapa");
  });

  it("administrador de cuenta ve ventas e ingreso", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.administrador_cuenta, "cuenta"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Ventas");
    expect(labels).toContain("Ingreso");
    expect(labels).toContain("Mapa");
  });

  it("filtra por permiso inventory:read en mapa", () => {
    const mapaItem = TENANT_NAV.find((item) => item.href === ROUTES.dashboardMapa);
    expect(mapaItem?.permission).toBe(PERMISSION.INVENTORY_READ);

    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.transportista, "bodega"),
    );
    expect(items.some((item) => item.href === ROUTES.dashboardMapa)).toBe(false);
  });

  it("PLATFORM_NAV no filtra ítems para configurador", () => {
    const items = filterNavItems(PLATFORM_NAV, {
      scope: "platform",
      idRol: WmsRol.configurador,
      nivelRol: "platform",
    });

    expect(items).toHaveLength(PLATFORM_NAV.length);
  });

  it("devuelve vacío sin idRol o nivelRol", () => {
    expect(
      filterNavItems(TENANT_NAV, {
        scope: "tenant",
        idRol: null,
        nivelRol: "bodega",
      }),
    ).toEqual([]);
  });
});
