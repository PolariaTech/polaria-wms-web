import { describe, expect, it } from "vitest";
import {
  listProductoCatalogoClavesServer,
  listProductosVentaCatalogoServer,
  resolveTenantSchemaForCuenta,
} from "./sales-catalog.server";
import { resolveTenantSchemaForCuenta as resolveFromTenantModule } from "./sales-catalog-tenant.server";

describe("sales-catalog.server", () => {
  it("re-exporta resolveTenantSchemaForCuenta desde el módulo tenant", () => {
    expect(resolveTenantSchemaForCuenta).toBe(resolveFromTenantModule);
  });

  it("devuelve vacío con cuenta en blanco sin consultar Supabase", async () => {
    await expect(listProductoCatalogoClavesServer("  ")).resolves.toEqual([]);
    await expect(listProductosVentaCatalogoServer("  ")).resolves.toEqual([]);
  });
});
