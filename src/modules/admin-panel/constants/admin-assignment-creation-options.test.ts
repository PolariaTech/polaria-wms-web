import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import {
  ADMIN_ASSIGNMENT_OPTIONS,
  ADMIN_CREATION_OPTIONS,
  ADMIN_ASSIGNMENT_CREATION_TITLE,
  getAdminAssignmentOptionHref,
  getAdminCreationOptionHref,
} from "./admin-assignment-creation-options";

describe("admin-assignment-creation-options", () => {
  it("expone el título Asignación y creación", () => {
    expect(ADMIN_ASSIGNMENT_CREATION_TITLE).toBe("Asignación y creación");
  });

  it("lista las opciones de creación", () => {
    expect(ADMIN_CREATION_OPTIONS.map((option) => option.title)).toEqual([
      "Proveedores",
      "Compradores",
      "Camiones",
    ]);
  });

  it("lista las opciones de asignación", () => {
    expect(ADMIN_ASSIGNMENT_OPTIONS.map((option) => option.title)).toEqual([
      "Usuarios",
      "Bodega interna",
      "Bodega externa",
    ]);
  });

  it("resuelve hrefs de creación", () => {
    expect(getAdminCreationOptionHref("proveedores")).toBe(
      ROUTES.dashboardAdminCreationSuppliers,
    );
    expect(getAdminCreationOptionHref("compradores")).toBe(
      ROUTES.dashboardAdminCreationBuyers,
    );
    expect(getAdminCreationOptionHref("camiones")).toBe(
      ROUTES.dashboardAdminCreationTrucks,
    );
  });

  it("resuelve hrefs de asignación", () => {
    expect(getAdminAssignmentOptionHref("usuarios")).toBe(
      ROUTES.dashboardAdminAssignmentUsers,
    );
    expect(getAdminAssignmentOptionHref("bodega-interna")).toBe(
      ROUTES.dashboardAdminAssignmentInternalWarehouse,
    );
    expect(getAdminAssignmentOptionHref("bodega-externa")).toBe(
      ROUTES.dashboardAdminAssignmentExternalWarehouse,
    );
  });
});
