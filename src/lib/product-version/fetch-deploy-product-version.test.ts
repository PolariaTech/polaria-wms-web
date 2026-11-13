import { describe, expect, it, vi } from "vitest";
import { fetchDeployProductVersion } from "./fetch-deploy-product-version";

describe("fetchDeployProductVersion", () => {
  it("devuelve la versión del deploy", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: "2.12.90" }),
    });
    await expect(fetchDeployProductVersion(fetchImpl)).resolves.toBe("2.12.90");
  });

  it("devuelve null si el fetch falla (sin alerta)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(fetchDeployProductVersion(fetchImpl)).resolves.toBeNull();
  });

  it("devuelve null si la respuesta no es ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ version: "x" }),
    });
    await expect(fetchDeployProductVersion(fetchImpl)).resolves.toBeNull();
  });
});
