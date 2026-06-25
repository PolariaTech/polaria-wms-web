import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { listOrdenesVenta } from "./sales.service";

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listOrdenesVenta consulta orden_venta con tenant", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listOrdenesVenta({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(from).toHaveBeenCalledWith("orden_venta");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "CUENTA-01");
    expect(chain.eq).toHaveBeenCalledWith("id_bodega", "BOD-01");
  });
});
