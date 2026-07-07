import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import {
  formatInventarioKg,
  getInventarioMercanciaReport,
} from "./inventario-mercancia-report.service";

describe("inventario-mercancia-report.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("formatInventarioKg usa separador local", () => {
    expect(formatInventarioKg(7884)).toMatch(/7\.?884/);
  });

  it("getInventarioMercanciaReport agrega stock por tipo de bodega", async () => {
    function createQueryChain(result: { data: unknown; error: null }) {
      const chain = {
        select: vi.fn(),
        eq: vi.fn(),
        then: (
          onFulfilled: (value: typeof result) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(onFulfilled, onRejected),
      };
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      return chain;
    }

    const stockChain = createQueryChain({
      data: [
        {
          cantidad: "1000",
          bodega: { tipo: "externa" },
        },
        {
          cantidad: "500",
          bodega: { tipo: "interna" },
        },
      ],
      error: null,
    });

    const emptyChain = createQueryChain({ data: [], error: null });

    const from = vi.fn((table: string) => {
      if (table === "warehouse_state") return stockChain;
      return emptyChain;
    });

    setSupabaseClientForTests({ from } as never);

    const report = await getInventarioMercanciaReport("MIT00");
    const externa = report.etapas.find((e) => e.id === "bodega_externa");
    const interna = report.etapas.find((e) => e.id === "bodega_interna");

    expect(externa?.kg).toBe(1000);
    expect(interna?.kg).toBe(500);
  });
});
