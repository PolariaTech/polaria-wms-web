import { describe, expect, it, vi } from "vitest";
import { applySurtidoCapturaToOrdenVenta } from "./orden-surtido-apply-captura";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("applySurtidoCapturaToOrdenVenta", () => {
  it("exige admin", async () => {
    await expect(
      applySurtidoCapturaToOrdenVenta({
        idOrdenVenta: "ov",
        payload: { campos: {}, checks: {}, lineas: [], observacionesIa: null },
      }),
    ).rejects.toThrow("Supabase admin no configurado");
  });
});