import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProductosVentaCatalogo } from "./sales-catalog.api";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: "tok" }),
  },
}));

describe("fetchProductosVentaCatalogo", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("si el catálogo responde error, no hay lectura de respaldo", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchProductosVentaCatalogo("023WA")).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("el archivo no vuelve a caer al cliente Supabase", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "sales-catalog.api.ts"),
      "utf8",
    );
    expect(source).not.toContain("listProductosVentaCatalogo");
    expect(source).not.toContain("catch");
  });
});
