import { describe, expect, it, vi } from "vitest";
import { syncOrdenVentaEstadoAlistamiento } from "./orden-surtido-sync-estado";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("syncOrdenVentaEstadoAlistamiento", () => {
  it("exige admin", async () => {
    await expect(
      syncOrdenVentaEstadoAlistamiento({ idOrdenVenta: "ov" }),
    ).rejects.toThrow("Supabase admin no configurado");
  });
});