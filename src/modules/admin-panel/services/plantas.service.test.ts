import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { createPlantaAdmin, listPlantasAdmin } from "./plantas.service";

describe("plantas.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listPlantasAdmin filtra por cuenta activa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          id_planta: "11111111-1111-1111-1111-111111111111",
          codigo: "PLANT",
          nombre: "Planta Norte",
          direccion: "Calle 100 # 20-30",
          capacidad_pallets: 120,
          rango_temperatura: "-18°C a 4°C",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listPlantasAdmin({ codigoCuenta: "FOODS1" });

    expect(from).toHaveBeenCalledWith("planta");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(chain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows[0]).toMatchObject({
      codigo: "PLANT",
      nombre: "Planta Norte",
      direccion: "Calle 100 # 20-30",
      capacidadPallets: 120,
      rangoTemperatura: "-18°C a 4°C",
    });
  });

  it("createPlantaAdmin inserta planta con capacidades", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_planta: "22222222-2222-2222-2222-222222222222",
        codigo: "PLANT",
        nombre: "Planta Norte",
        direccion: "Calle 100 # 20-30",
        capacidad_pallets: 120,
        rango_temperatura: "-18°C a 4°C",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createPlantaAdmin({
      codigoCuenta: "FOODS1",
      nombre: "Planta Norte",
      direccion: "Calle 100 # 20-30",
      capacidadPallets: 120,
      rangoTemperatura: "-18°C a 4°C",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "FOODS1",
        nombre: "Planta Norte",
        direccion: "Calle 100 # 20-30",
        capacidad_pallets: 120,
        rango_temperatura: "-18°C a 4°C",
        esta_activo: true,
      }),
    );
    expect(row.nombre).toBe("Planta Norte");
  });
});
