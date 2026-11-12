import { describe, expect, it, vi } from "vitest";

vi.mock("@/constants/brand/brand", () => ({
  POLARIA_PRODUCT_VERSION: "2.12.99",
}));

import { GET } from "./route";

describe("GET /api/product-version", () => {
  it("devuelve la versión del deploy sin caché (REQ-293)", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({ version: "2.12.99" });
  });
});
