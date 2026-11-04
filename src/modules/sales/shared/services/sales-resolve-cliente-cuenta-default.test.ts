import { beforeEach, describe, expect, it, vi } from "vitest";

const runDomainQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/domain-query", () => ({
  runDomainQuery,
}));

import { resolveClienteCuentaDefault } from "./sales-resolve-cliente-cuenta-default";

describe("resolveClienteCuentaDefault", () => {
  beforeEach(() => {
    runDomainQuery.mockReset();
  });

  it("devuelve el primer cliente activo", async () => {
    runDomainQuery.mockResolvedValue([{ id_cliente: "cli-1" }]);
    await expect(resolveClienteCuentaDefault("C1")).resolves.toBe("cli-1");
  });

  it("falla si no hay cliente", async () => {
    runDomainQuery.mockResolvedValue([]);
    await expect(resolveClienteCuentaDefault("C1")).rejects.toThrow(
      /No hay cliente activo/,
    );
  });
});
