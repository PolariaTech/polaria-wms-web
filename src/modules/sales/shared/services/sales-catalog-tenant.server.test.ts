import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  resolveTenantSchemaForCuenta,
  tenantFrom,
} from "./sales-catalog-tenant.server";

describe("sales-catalog-tenant.server", () => {
  it("resolveTenantSchemaForCuenta devuelve null con cuenta vacía", async () => {
    const admin = {} as SupabaseClient;
    await expect(resolveTenantSchemaForCuenta(admin, "  ")).resolves.toBeNull();
  });

  it("tenantFrom usa public sin schema y schema propio cuando existe", () => {
    const publicFrom = vi.fn().mockReturnValue("public-table");
    const schemaFrom = vi.fn().mockReturnValue("schema-table");
    const schema = vi.fn().mockReturnValue({ from: schemaFrom });
    const admin = { from: publicFrom, schema } as unknown as SupabaseClient;

    expect(tenantFrom(admin, null)("producto")).toBe("public-table");
    expect(tenantFrom(admin, "emp_x")("producto")).toBe("schema-table");
    expect(schema).toHaveBeenCalledWith("emp_x");
  });
});
