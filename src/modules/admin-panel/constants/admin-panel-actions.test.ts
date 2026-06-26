import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import {
  ADMIN_PANEL_ACTIONS,
  ADMIN_PANEL_TITLE,
  getAdminPanelActionHref,
} from "./admin-panel-actions";

describe("admin-panel-actions", () => {
  it("expone el título Panel administrativo", () => {
    expect(ADMIN_PANEL_TITLE).toBe("Panel administrativo");
  });

  it("mapea las tres acciones del panel", () => {
    expect(ADMIN_PANEL_ACTIONS.map((action) => action.title)).toEqual([
      "Asignación y creación",
      "Catálogo",
      "Reportes",
    ]);
  });

  it("resuelve hrefs de acciones", () => {
    expect(getAdminPanelActionHref("assignment-creation")).toBe(
      ROUTES.dashboardAdminAssignmentCreation,
    );
    expect(getAdminPanelActionHref("catalog")).toBe(ROUTES.dashboardCatalog);
    expect(getAdminPanelActionHref("reports")).toBe(ROUTES.dashboardReporteria);
  });
});
