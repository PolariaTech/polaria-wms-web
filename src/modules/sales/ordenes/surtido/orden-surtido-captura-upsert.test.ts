import { describe, expect, it, vi } from "vitest";
import { upsertOrdenSurtidoCaptura } from "./orden-surtido-captura-upsert";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("upsertOrdenSurtidoCaptura", () => {
  it("exige admin", async () => {
    await expect(
      upsertOrdenSurtidoCaptura({
        idOrdenVenta: "ov",
        codigoCuenta: "c",
        urlFoto: null,
        payload: { campos: {}, checks: {}, lineas: [], observacionesIa: null },
        modelo: "m",
      }),
    ).rejects.toThrow("Supabase admin no configurado");
  });
});