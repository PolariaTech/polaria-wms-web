import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { createPlantaAdmin, listPlantasAdmin, updatePlantaAdmin } from "./plantas.service";

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

  it("updatePlantaAdmin actualiza datos sin cambiar el código", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: {
        id_planta: "22222222-2222-2222-2222-222222222222",
        codigo: "PLANT",
        nombre: "Planta Sur",
        direccion: "Calle 200 # 10-20",
        capacidad_pallets: 80,
        rango_temperatura: "0°C a 8°C",
      },
      error: null,
    });

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const row = await updatePlantaAdmin({
      codigoCuenta: "FOODS1",
      idPlanta: "22222222-2222-2222-2222-222222222222",
      nombre: "Planta Sur",
      direccion: "Calle 200 # 10-20",
      capacidadPallets: 80,
      rangoTemperatura: "0°C a 8°C",
    });

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Planta Sur",
        direccion: "Calle 200 # 10-20",
        capacidad_pallets: 80,
        rango_temperatura: "0°C a 8°C",
      }),
    );
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ codigo: expect.anything() }),
    );
    expect(updateChain.eq).toHaveBeenCalledWith(
      "id_planta",
      "22222222-2222-2222-2222-222222222222",
    );
    expect(updateChain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(row.nombre).toBe("Planta Sur");
    expect(row.codigo).toBe("PLANT");
  });
});
