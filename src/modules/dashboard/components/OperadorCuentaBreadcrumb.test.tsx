import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import { getOperadorCuentaBreadcrumbTrail } from "./OperadorCuentaBreadcrumb";

describe("getOperadorCuentaBreadcrumbTrail", () => {
  it("no muestra breadcrumb en inicio", () => {
    expect(getOperadorCuentaBreadcrumbTrail(ROUTES.dashboard)).toBeNull();
  });

  it("genera Inicio / Compras", () => {
    expect(getOperadorCuentaBreadcrumbTrail(ROUTES.dashboardCompras)).toEqual([
      { label: "Inicio", href: ROUTES.dashboard },
      { label: "Compras" },
    ]);
  });

  it("genera Inicio / Bodega externa / Integración", () => {
    expect(
      getOperadorCuentaBreadcrumbTrail(
        ROUTES.dashboardBodegaExternaCuentaIntegracion,
      ),
    ).toEqual([
      { label: "Inicio", href: ROUTES.dashboard },
      { label: "Bodega externa", href: ROUTES.dashboardBodegaExternaCuenta },
      { label: "Integración" },
    ]);
  });

  it("genera Inicio / Bodega interna / Procesamiento", () => {
    expect(
      getOperadorCuentaBreadcrumbTrail(
        ROUTES.dashboardBodegaInternaCuentaProcesamiento,
      ),
    ).toEqual([
      { label: "Inicio", href: ROUTES.dashboard },
      { label: "Bodega interna", href: ROUTES.dashboardBodegaInternaCuenta },
      { label: "Procesamiento" },
    ]);
  });

  it("genera Inicio / Ventas / Órdenes venta", () => {
    expect(getOperadorCuentaBreadcrumbTrail(ROUTES.dashboardVentasOrdenes)).toEqual(
      [
        { label: "Inicio", href: ROUTES.dashboard },
        { label: "Ventas", href: ROUTES.dashboardVentas },
        { label: "Órdenes venta" },
      ],
    );
  });

  it("devuelve null en rutas no mapeadas", () => {
    expect(getOperadorCuentaBreadcrumbTrail(ROUTES.dashboardMapa)).toBeNull();
  });
});
