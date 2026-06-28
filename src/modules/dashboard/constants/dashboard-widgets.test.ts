import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import { WmsRol } from "@/constants/roles";
import {
  DASHBOARD_WIDGETS,
  getWidgetsForRole,
  ROLE_DASHBOARD_WIDGETS,
} from "./dashboard-widgets";

describe("getWidgetsForRole", () => {
  it("administrador_cuenta ve widgets de cuenta", () => {
    const widgets = getWidgetsForRole(WmsRol.administrador_cuenta);
    expect(widgets.map((w) => w.id)).toEqual([
      "ov-pendientes",
      "sol-compra",
      "alertas-cuenta",
    ]);
  });

  it("administrador_bodega ve widgets de bodega", () => {
    const widgets = getWidgetsForRole(WmsRol.administrador_bodega);
    expect(widgets.map((w) => w.id)).toEqual([
      "stock-resumido",
      "tareas-cola",
      "alertas-bodega",
    ]);
  });

  it("operario ve tareas asignadas y accesos picking", () => {
    const widgets = getWidgetsForRole(WmsRol.operario);
    expect(widgets.map((w) => w.id)).toEqual([
      "tareas-asignadas",
      "accesos-picking",
    ]);
  });

  it("procesador ve cola de procesamiento", () => {
    const widgets = getWidgetsForRole(WmsRol.procesador);
    expect(widgets.map((w) => w.id)).toEqual(["cola-procesamiento"]);
  });

  it("transportista ve guías de transporte", () => {
    const widgets = getWidgetsForRole(WmsRol.transportista);
    expect(widgets.map((w) => w.id)).toEqual(["guias-transporte"]);
  });

  it("configurador no tiene widgets en dashboard", () => {
    expect(getWidgetsForRole(WmsRol.configurador)).toEqual([]);
    expect(ROLE_DASHBOARD_WIDGETS[WmsRol.configurador]).toEqual([]);
  });

  it("operador_cuenta no ve widgets en dashboard", () => {
    expect(getWidgetsForRole(WmsRol.operador_cuenta)).toEqual([]);
    expect(ROLE_DASHBOARD_WIDGETS[WmsRol.operador_cuenta]).toEqual([]);
  });

  it("sol-compra apunta a compras", () => {
    expect(DASHBOARD_WIDGETS["sol-compra"].href).toBe(ROUTES.dashboardCompras);
  });

  it("devuelve vacío sin rol", () => {
    expect(getWidgetsForRole(null)).toEqual([]);
  });
});
