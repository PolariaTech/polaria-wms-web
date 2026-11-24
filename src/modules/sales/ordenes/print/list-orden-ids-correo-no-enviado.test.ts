import { beforeEach, describe, expect, it, vi } from "vitest";

const runDomainQuery = vi.fn();
vi.mock("@/lib/supabase/domain-query", () => ({
  requireCodigoCuenta: (v: string) => v.trim(),
  runDomainQuery: (...args: unknown[]) => runDomainQuery(...args),
}));

describe("listOrdenIdsCorreoNoEnviado", () => {
  beforeEach(() => {
    runDomainQuery.mockReset();
  });

  it("sin ids no consulta auditoría", async () => {
    const { listOrdenIdsCorreoNoEnviado } = await import(
      "./list-orden-ids-correo-no-enviado"
    );
    await expect(
      listOrdenIdsCorreoNoEnviado({ codigoCuenta: "C-1", idOrdenes: [] }),
    ).resolves.toEqual(new Set());
    expect(runDomainQuery).not.toHaveBeenCalled();
  });

  it("consulta los grupos en paralelo", async () => {
    runDomainQuery.mockResolvedValue([]);
    const { listOrdenIdsCorreoNoEnviado } = await import(
      "./list-orden-ids-correo-no-enviado"
    );
    const ids = Array.from({ length: 90 }, (_, i) => `ov-${i}`);
    await listOrdenIdsCorreoNoEnviado({ codigoCuenta: "C-1", idOrdenes: ids });
    expect(runDomainQuery).toHaveBeenCalledTimes(2);
  });
});
