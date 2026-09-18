import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import {
  CUENTA_COCKPIT_SECTIONS,
  getCuentaGobiernoHref,
  getCuentaGobiernoModuloHref,
  isCuentaCockpitModalModulo,
  isCuentaCockpitModuloId,
} from "./cuenta-cockpit";

describe("cuenta-cockpit", () => {
  it("arma las rutas de gobierno de una cuenta", () => {
    expect(getCuentaGobiernoHref("MIT00")).toBe(
      `${ROUTES.configuratorAccounts}/MIT00`,
    );
    expect(getCuentaGobiernoModuloHref("MIT00", "usuarios")).toBe(
      `${ROUTES.configuratorAccounts}/MIT00/usuarios`,
    );
  });

  it("reconoce módulos del cockpit y los que se abren como modal", () => {
    expect(isCuentaCockpitModuloId("acceso")).toBe(true);
    expect(isCuentaCockpitModuloId("catalogo")).toBe(true);
    expect(isCuentaCockpitModuloId("otro")).toBe(false);
    expect(isCuentaCockpitModalModulo("acceso")).toBe(true);
    expect(isCuentaCockpitModalModulo("bodegas")).toBe(true);
    expect(isCuentaCockpitModalModulo("usuarios")).toBe(false);
  });

  it("cubre cuenta, maestros y operación", () => {
    expect(CUENTA_COCKPIT_SECTIONS.map((section) => section.title)).toEqual([
      "Cuenta",
      "Maestros",
      "Operación",
    ]);
  });
});
