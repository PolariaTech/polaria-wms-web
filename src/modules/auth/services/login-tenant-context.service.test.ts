import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTenantEmpresasForLogin } from "./login-tenant-context.service";

describe("login-tenant-context.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve empresas resueltas por el endpoint interno", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          empresas: [{ codigoEmpresa: "FOODS", razonSocial: "Foods Corp" }],
        }),
      }),
    );

    const empresas = await resolveTenantEmpresasForLogin("foods@polaria.tech");

    expect(fetch).toHaveBeenCalledWith("/login/resolve-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "foods@polaria.tech" }),
    });
    expect(empresas).toEqual([
      { codigoEmpresa: "FOODS", razonSocial: "Foods Corp" },
    ]);
  });

  it("lanza error si el endpoint falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(
      resolveTenantEmpresasForLogin("foods@polaria.tech"),
    ).rejects.toThrow("No se pudo resolver la empresa");
  });
});
