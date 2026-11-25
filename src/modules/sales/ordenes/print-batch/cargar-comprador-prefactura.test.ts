import { beforeEach, describe, expect, it, vi } from "vitest";

const consultar = vi.fn();

vi.mock("@/lib/supabase/domain-query", () => ({
  runDomainQuery: async (ejecutar: (client: unknown) => Promise<{ data: unknown; error: { message: string } | null }>) => {
    const resultado = await ejecutar({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: () => consultar() }),
        }),
      }),
    });
    if (resultado.error) throw new Error(resultado.error.message);
    return resultado.data;
  },
}));

import { cargarCompradorPrefactura } from "./cargar-comprador-prefactura";

beforeEach(() => {
  consultar.mockReset();
});

describe("cargarCompradorPrefactura", () => {
  it("no consulta si la orden no tiene comprador", async () => {
    const fiscal = await cargarCompradorPrefactura(null);

    expect(consultar).not.toHaveBeenCalled();
    expect(fiscal.regimenFiscal).toBe("");
    expect(fiscal.domicilioFiscal).toBe("");
  });

  it("lee régimen, domicilio fiscal y formas de pago del comprador", async () => {
    consultar.mockResolvedValue({
      data: {
        regimen: "626 — RESICO",
        cp_fiscal: "05348",
        metodo_pago: "PPD — Parcialidades o diferido",
        forma_pago: "99 — Por definir",
      },
      error: null,
    });

    const fiscal = await cargarCompradorPrefactura("comp-1");

    expect(fiscal.regimenFiscal).toBe("626 — RESICO");
    expect(fiscal.domicilioFiscal).toBe("05348");
    expect(fiscal.metodoPago).toBe("PPD — Parcialidades o diferido");
    expect(fiscal.formaPago).toBe("99 — Por definir");
  });
});
