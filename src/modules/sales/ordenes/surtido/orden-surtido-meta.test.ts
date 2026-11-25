import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrdenMetaPublica } from "./orden-surtido-meta";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => null,
}));

describe("getOrdenMetaPublica", () => {
  beforeEach(() => vi.clearAllMocks());

  it("falla si no hay admin", async () => {
    await expect(getOrdenMetaPublica("ov-1")).rejects.toThrow(
      "Supabase admin no configurado",
    );
  });
});