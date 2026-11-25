import { beforeEach, describe, expect, it } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  listOrdenesCompra,
  listRecepciones,
  listSolicitudesCompra,
} from "./purchases.service.queries";

describe("purchases.service.queries", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
  });

  it("listSolicitudesCompra consulta solicitud_compra por cuenta", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await expect(
      listSolicitudesCompra({ codigoCuenta: "CUENTA-01" }),
    ).resolves.toEqual([]);

    expect(from).toHaveBeenCalledWith("solicitud_compra");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "CUENTA-01");
  });

  it("listOrdenesCompra consulta orden_compra", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listOrdenesCompra({ codigoCuenta: "CUENTA-01" });

    expect(from).toHaveBeenCalledWith("orden_compra");
  });

  it("listRecepciones exige codigo_cuenta", async () => {
    await expect(listRecepciones({ codigoCuenta: "" })).rejects.toBeInstanceOf(
      DomainServiceError,
    );
  });
});
