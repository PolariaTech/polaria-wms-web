import { describe, expect, it, vi } from "vitest";
import {
  getOrdenSurtidoCaptura,
  listOrdenSurtidoCapturas,
} from "./orden-surtido-captura-queries";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("orden-surtido-captura-queries", () => {
  it("exige admin", async () => {
    await expect(getOrdenSurtidoCaptura("ov")).rejects.toThrow(
      "Supabase admin no configurado",
    );
    await expect(listOrdenSurtidoCapturas("ov")).rejects.toThrow(
      "Supabase admin no configurado",
    );
  });
});