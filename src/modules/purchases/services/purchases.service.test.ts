import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/domain-service-error";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  listOrdenesCompra,
  listRecepciones,
  listSolicitudesCompra,
} from "./purchases.service";

describe("purchases.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listSolicitudesCompra filtra por codigo_cuenta", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listSolicitudesCompra({ codigoCuenta: "CUENTA-01" });

    expect(from).toHaveBeenCalledWith("solicitud_compra");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "CUENTA-01");
  });

  it("listOrdenesCompra filtra por bodega cuando se indica", async () => {
    const { client, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listOrdenesCompra({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(chain.eq).toHaveBeenCalledWith("id_bodega", "BOD-01");
  });

  it("listRecepciones exige codigo_cuenta", async () => {
    await expect(
      listRecepciones({ codigoCuenta: "" }),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });
});
