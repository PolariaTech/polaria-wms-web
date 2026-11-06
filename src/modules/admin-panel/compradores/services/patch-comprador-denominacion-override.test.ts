import { beforeEach, describe, expect, it, vi } from "vitest";

const runDomainMutation = vi.fn();
const requireCodigoCuenta = vi.fn((value: string) => value.trim());

vi.mock("@/lib/supabase/domain-query", () => ({
  requireCodigoCuenta: (value: string) => requireCodigoCuenta(value),
  runDomainMutation: (...args: unknown[]) => runDomainMutation(...args),
}));

import { patchCompradorDenominacionOverride } from "./patch-comprador-denominacion-override";

describe("patchCompradorDenominacionOverride (REQ-241)", () => {
  beforeEach(() => {
    runDomainMutation.mockReset();
    requireCodigoCuenta.mockImplementation((value: string) => value.trim());
  });

  it("persiste el override en comprador", async () => {
    runDomainMutation.mockResolvedValue({
      id_comprador: "c1",
    });

    await patchCompradorDenominacionOverride({
      codigoCuenta: "mit",
      idComprador: "c1",
      denominacionComercialOverride: "Luis",
    });

    expect(runDomainMutation).toHaveBeenCalledTimes(1);
    const factory = runDomainMutation.mock.calls[0]![0] as (client: {
      from: (table: string) => unknown;
    }) => unknown;

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id_comprador: "c1" },
      error: null,
    });
    const select = vi.fn(() => ({ maybeSingle }));
    const eq2 = vi.fn(() => ({ select }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ update }));

    await factory({ from });

    expect(from).toHaveBeenCalledWith("comprador");
    expect(update).toHaveBeenCalledWith({
      denominacion_comercial_override: "Luis",
    });
  });

  it("falla si no hay id de comprador", async () => {
    await expect(
      patchCompradorDenominacionOverride({
        codigoCuenta: "mit",
        idComprador: "  ",
        denominacionComercialOverride: "Luis",
      }),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
  });
});
