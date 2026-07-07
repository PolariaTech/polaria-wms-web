import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  formatCamionMarcaModelo,
  getCamionTipoLabel,
} from "../constants/camion-types";
import { createCamionAdmin, listCamionesAdmin } from "./camiones.service";

describe("camion-types", () => {
  it("formatea marca y modelo", () => {
    expect(formatCamionMarcaModelo("Volvo", "FH16")).toBe("Volvo / FH16");
    expect(formatCamionMarcaModelo(null, null)).toBe("—");
  });

  it("resuelve etiqueta de tipo", () => {
    expect(getCamionTipoLabel("refrigerado")).toBe("Refrigerado");
  });
});

describe("camiones.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listCamionesAdmin filtra por cuenta activa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          id_camion: "11111111-1111-1111-1111-111111111111",
          codigo: "ABC12",
          placa: "ABC123",
          marca: "Volvo",
          modelo: "FH16",
          capacidad_kg: 18000,
          capacidad_m3: 45,
          capacidad_pallets: 20,
          tipo: "refrigerado",
          rango_temperatura: "-18°C a 4°C",
          disponible: true,
          created_at: "2026-06-25T12:00:00.000Z",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listCamionesAdmin({ codigoCuenta: "FOODS1" });

    expect(from).toHaveBeenCalledWith("camion");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(chain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows[0]?.placa).toBe("ABC123");
    expect(rows[0]?.capacidadKg).toBe(18000);
  });

  it("createCamionAdmin inserta camión con capacidades", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_camion: "22222222-2222-2222-2222-222222222222",
        codigo: "ABC12",
        placa: "ABC123",
        marca: "Volvo",
        modelo: "FH16",
        capacidad_kg: 18000,
        capacidad_m3: 45,
        capacidad_pallets: 20,
        tipo: "refrigerado",
        rango_temperatura: "-18°C a 4°C",
        disponible: true,
        created_at: "2026-06-25T12:00:00.000Z",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createCamionAdmin({
      codigoCuenta: "FOODS1",
      placa: "ABC123",
      marca: "Volvo",
      modelo: "FH16",
      capacidadKg: 18000,
      capacidadM3: 45,
      capacidadPallets: 20,
      tipo: "refrigerado",
      rangoTemperatura: "-18°C a 4°C",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "FOODS1",
        placa: "ABC123",
        marca: "Volvo",
        modelo: "FH16",
        tipo: "refrigerado",
        disponible: true,
        esta_activo: true,
      }),
    );
    expect(row.placa).toBe("ABC123");
  });
});
