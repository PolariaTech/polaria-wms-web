import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import {
  CONFIGURATOR_ACTIONS,
  getConfiguratorActionHref,
} from "./configurator-actions";

describe("getConfiguratorActionHref", () => {
  it("mapea cada acción a su sub-ruta", () => {
    expect(getConfiguratorActionHref("creation")).toBe(
      ROUTES.configuratorCreation,
    );
    expect(getConfiguratorActionHref("creation-assignment")).toBe(
      ROUTES.configuratorAssignment,
    );
    expect(getConfiguratorActionHref("integration")).toBe(
      ROUTES.configuratorIntegration,
    );
  });

  it("CONFIGURATOR_ACTIONS incluye href por acción", () => {
    for (const action of CONFIGURATOR_ACTIONS) {
      expect(action.href).toMatch(/^\/configurador\//);
    }
  });
});
