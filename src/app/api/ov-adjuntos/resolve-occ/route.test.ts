import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/modules/sales/ordenes/ai/file-extractors", () => ({
  extractFiles: vi.fn(),
}));

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { extractFiles } from "@/modules/sales/ordenes/ai/file-extractors";
import { GET } from "./route";

describe("GET /api/ov-adjuntos/resolve-occ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-279: incluye totalSolicitud leído del texto del adjunto", async () => {
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      storage: {
        from: () => ({
          download: vi.fn().mockResolvedValue({
            data: new Blob(["dummy"]),
            error: null,
          }),
        }),
      },
    } as never);
    vi.mocked(extractFiles).mockResolvedValue([
      {
        nombre: "oc.pdf",
        tipo: "texto",
        contenido: "PO Waldorf\nTOTAL: $2,450.00\nItems",
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/ov-adjuntos/resolve-occ?path=cuenta%2Foc.pdf",
      ),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { totalSolicitud: number | null };
    expect(body.totalSolicitud).toBe(2450);
  });

  it("rechaza path inválido", async () => {
    const response = await GET(
      new Request("http://localhost/api/ov-adjuntos/resolve-occ?path=../x"),
    );
    expect(response.status).toBe(400);
  });
});
