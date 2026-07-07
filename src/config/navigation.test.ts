import { describe, expect, it } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
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
  it("operario ve mapa y operación pero no ingreso ni reportería", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.operario, "bodega"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Inicio");
    expect(labels).toContain("Mapa");
    expect(labels).toContain("Operación");
    expect(labels).not.toContain("Ingreso");
    expect(labels).not.toContain("Compras");
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

  it("procesador ve inicio, ingreso, operación y procesamiento", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.procesador, "bodega"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Procesamiento");
    expect(labels).toContain("Operación");
    expect(labels).not.toContain("Mapa");
  });

  it("administrador de cuenta ve ventas y compras sin ingreso ni mapa", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.administrador_cuenta, "cuenta"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Ventas");
    expect(labels).toContain("Compras");
    expect(labels).toContain("Transporte");
    expect(labels).not.toContain("Ingreso");
    expect(labels).not.toContain("Mapa");
  });

  it("operador de cuenta ve inicio, compras, procesamiento y ventas", () => {
    const items = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.operador_cuenta, "cuenta"),
    );

    const labels = items.map((item) => item.label);
    expect(labels).toEqual(["Inicio", "Compras", "Procesamiento", "Ventas"]);
  });

  it("filtra mapa por roles de bodega", () => {
    const mapaItem = TENANT_NAV.find((item) => item.href === ROUTES.dashboardMapa);
    expect(mapaItem?.roles).toBeDefined();

    const cuentaItems = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.administrador_cuenta, "cuenta"),
    );
    expect(cuentaItems.some((item) => item.href === ROUTES.dashboardMapa)).toBe(
      false,
    );

    const bodegaItems = filterNavItems(
      TENANT_NAV,
      tenantContext(WmsRol.operario, "bodega"),
    );
    expect(bodegaItems.some((item) => item.href === ROUTES.dashboardMapa)).toBe(
      true,
    );
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
