import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createCompradorAdmin,
  listCompradoresAdmin,
} from "./compradores.service";

describe("compradores.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listCompradoresAdmin filtra por cuenta activa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          id_comprador: "11111111-1111-1111-1111-111111111111",
          codigo: "LUIS1",
          nombre: "Luis Castillo",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listCompradoresAdmin({ codigoCuenta: "FOODS1" });

    expect(from).toHaveBeenCalledWith("comprador");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(chain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows).toEqual([
      {
        idComprador: "11111111-1111-1111-1111-111111111111",
        codigo: "LUIS1",
        comprador: "Luis Castillo",
      },
    ]);
  });

  it("createCompradorAdmin inserta comprador con código autogenerado", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_comprador: "22222222-2222-2222-2222-222222222222",
        codigo: "LUIS1",
        nombre: "Luis Castillo",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createCompradorAdmin({
      codigoCuenta: "FOODS1",
      nombre: "Luis Castillo",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "FOODS1",
        nombre: "Luis Castillo",
        esta_activo: true,
      }),
    );
    expect(row.comprador).toBe("Luis Castillo");
  });
});
