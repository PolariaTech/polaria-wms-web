import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  setSupabaseClientForTests,
} from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { listWarehouseState } from "./inventory.service";

describe("inventory.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listWarehouseState filtra por id_bodega", async () => {
    const row = {
      id_warehouse_state: "ws-1",
      codigo_cuenta: "CUENTA-01",
      id_bodega: "BOD-01",
      id_ubicacion: "UBI-1",
      id_producto: "PROD-1",
      id_lote: null,
      cantidad: "10",
      cantidad_reservada: "0",
      temperatura: null,
      locked_by: null,
      locked_at: null,
      version: 1,
      updated_at: "2026-01-01T00:00:00Z",
    };

    const { client, from, chain } = createSupabaseMock({ data: [row] });
    setSupabaseClientForTests(client);

    const result = await listWarehouseState({ idBodega: "BOD-01" });

    expect(from).toHaveBeenCalledWith("warehouse_state");
    expect(chain.eq).toHaveBeenCalledWith("id_bodega", "BOD-01");
    expect(result).toEqual([row]);
  });

  it("lanza DomainServiceError si falta id_bodega", async () => {
    await expect(listWarehouseState({ idBodega: "" })).rejects.toBeInstanceOf(
      DomainServiceError,
    );
  });

  it("lanza DomainServiceError si Supabase devuelve error", async () => {
    const { client } = createSupabaseMock({
      data: null,
      error: { message: "RLS violation" },
    });
    setSupabaseClientForTests(client);

    await expect(
      listWarehouseState({ idBodega: "BOD-01" }),
    ).rejects.toMatchObject({
      code: "QUERY_FAILED",
      message: "RLS violation",
    });
  });
});
