import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSalesCatalogCaches,
  getProductosVentaCatalogoCache,
  getTenantSchemaCache,
  setProductosVentaCatalogoCache,
  setTenantSchemaCache,
} from "./sales-catalog-cache.server";

describe("sales-catalog-cache.server", () => {
  beforeEach(() => {
    clearSalesCatalogCaches();
  });

  it("cachea y reutiliza el catálogo de productos por cuenta", () => {
    expect(getProductosVentaCatalogoCache("C-1")).toBeNull();
    setProductosVentaCatalogoCache("C-1", [{ id: 1 }]);
    expect(getProductosVentaCatalogoCache("C-1")).toEqual([{ id: 1 }]);
    expect(getProductosVentaCatalogoCache("C-2")).toBeNull();
  });

  it("distingue miss (undefined) de schema null cacheado", () => {
    expect(getTenantSchemaCache("C-1")).toBeUndefined();
    setTenantSchemaCache("C-1", null);
    expect(getTenantSchemaCache("C-1")).toBeNull();
    setTenantSchemaCache("C-2", "emp_demo");
    expect(getTenantSchemaCache("C-2")).toBe("emp_demo");
  });
});
