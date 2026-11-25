import { describe, expect, it, vi } from "vitest";
import { buildPrintDataAdmin } from "./orden-surtido-print-admin";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("buildPrintDataAdmin", () => {
  it("falla si no hay admin", async () => {
    await expect(buildPrintDataAdmin("ov-1")).rejects.toThrow(
      "Supabase admin no configurado",
    );
  });
});