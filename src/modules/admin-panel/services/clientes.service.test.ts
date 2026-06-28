import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createClienteAdmin,
  listClientesAdmin,
} from "./clientes.service";

describe("clientes.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listClientesAdmin filtra por cuenta activa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          id_cliente: "11111111-1111-1111-1111-111111111111",
          codigo: "ACME1",
          nombre: "Distribuidora ACME",
          nit: "900123456-7",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listClientesAdmin({ codigoCuenta: "FOODS1" });

    expect(from).toHaveBeenCalledWith("cliente");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(chain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows[0]).toMatchObject({
      codigo: "ACME1",
      nombre: "Distribuidora ACME",
      nit: "900123456-7",
    });
  });

  it("createClienteAdmin inserta cliente con NIT normalizado", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_cliente: "22222222-2222-2222-2222-222222222222",
        codigo: "ACME1",
        nombre: "Distribuidora ACME",
        nit: "900123456-7",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createClienteAdmin({
      codigoCuenta: "FOODS1",
      nombre: "Distribuidora ACME",
      nit: "900123456 - 7",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "FOODS1",
        nombre: "Distribuidora ACME",
        nit: "900123456-7",
        esta_activo: true,
      }),
    );
    expect(row.nit).toBe("900123456-7");
  });
});
