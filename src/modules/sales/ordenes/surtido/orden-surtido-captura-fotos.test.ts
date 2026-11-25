import { describe, expect, it, vi } from "vitest";
import {
  listOrdenSurtidoCapturaFotos,
  listOrdenSurtidoCapturaOtsConFotos,
} from "./orden-surtido-captura-fotos";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("orden-surtido-captura-fotos", () => {
  it("exige admin", async () => {
    await expect(listOrdenSurtidoCapturaOtsConFotos("ov")).rejects.toThrow(
      "Supabase admin no configurado",
    );
    await expect(listOrdenSurtidoCapturaFotos("ov")).rejects.toThrow(
      "Supabase admin no configurado",
    );
  });
});