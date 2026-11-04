import { beforeEach, describe, expect, it, vi } from "vitest";

const runDomainQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/domain-query", () => ({
  requireCodigoCuenta: (codigo: string) => codigo.trim(),
  runDomainQuery,
}));

import { fetchUltimaDireccionEntregaPorComprador } from "./sales-ultima-direccion-entrega";

describe("fetchUltimaDireccionEntregaPorComprador (REQ-252)", () => {
  beforeEach(() => {
    runDomainQuery.mockReset();
  });

  it("devuelve null sin idComprador", async () => {
    await expect(
      fetchUltimaDireccionEntregaPorComprador({
        codigoCuenta: "C1",
        idComprador: "  ",
      }),
    ).resolves.toBeNull();
    expect(runDomainQuery).not.toHaveBeenCalled();
  });

  it("devuelve la primera dirección no vacía", async () => {
    runDomainQuery.mockResolvedValue([
      { direccion_entrega: "  " },
      { direccion_entrega: "Av. Uno 10" },
    ]);
    await expect(
      fetchUltimaDireccionEntregaPorComprador({
        codigoCuenta: "C1",
        idComprador: "comp-1",
      }),
    ).resolves.toBe("Av. Uno 10");
  });
});
