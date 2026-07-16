import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  listEvidenciasTransporte,
  listGuiasEnvio,
  listViajesEntrega,
} from "./transport.service";

describe("transport.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listGuiasEnvio consulta guia_envio", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listGuiasEnvio({ codigoCuenta: "CUENTA-01" });

    expect(from).toHaveBeenCalledWith("guia_envio");
  });

  it("listEvidenciasTransporte filtra por id_guia si se indica", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listEvidenciasTransporte({
      codigoCuenta: "CUENTA-01",
      idGuia: "GUIA-01",
    });

    expect(from).toHaveBeenCalledWith("evidencia_transporte");
    expect(chain.eq).toHaveBeenCalledWith("id_guia", "GUIA-01");
  });

  it("listViajesEntrega consulta viaje_transporte en curso", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    const rows = await listViajesEntrega({ codigoCuenta: "CUENTA-01" });

    expect(from).toHaveBeenCalledWith("viaje_transporte");
    expect(chain.in).toHaveBeenCalledWith("estado", ["programado", "en_ruta"]);
    expect(rows).toEqual([]);
  });
});
