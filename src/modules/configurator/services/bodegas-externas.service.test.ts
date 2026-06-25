import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { getCreationOptionHref } from "../constants/creation-options";
import {
  createBodegaExternaConfigurator,
  listBodegasExternasConfigurator,
} from "./bodegas-externas.service";

describe("creation-options bodega externa", () => {
  it("resuelve ruta de bodega externa", () => {
    expect(getCreationOptionHref("bodega-externa")).toBe(
      ROUTES.configuratorCreationExternalWarehouse,
    );
  });
});

describe("bodegas-externas.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listBodegasExternasConfigurator filtra tipo externa", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.order.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue({
      data: [
        {
          id_bodega: "bodega-2",
          nombre: "Depósito Sur",
          capacidad_slots: 200,
          cuenta: { nombre_comercial: "Mitre" },
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listBodegasExternasConfigurator();

    expect(from).toHaveBeenCalledWith("bodega");
    expect(selectChain.eq).toHaveBeenCalledWith("tipo", "externa");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      {
        idBodega: "bodega-2",
        nombre: "Depósito Sur",
        capacidad: 200,
        bodegaAsignada: "Mitre",
      },
    ]);
  });

  it("createBodegaExternaConfigurator inserta bodega externa", async () => {
    let call = 0;
    const cuentaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    cuentaChain.select.mockReturnValue(cuentaChain);
    cuentaChain.eq.mockReturnValue(cuentaChain);
    cuentaChain.order.mockReturnValue(cuentaChain);
    cuentaChain.limit.mockResolvedValue({
      data: [{ codigo_cuenta: "MIT00", nombre_comercial: "Mitre" }],
      error: null,
    });

    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: { id_bodega: "bodega-2" },
      error: null,
    });

    const from = vi.fn(() => {
      call += 1;
      return call === 1 ? cuentaChain : insertChain;
    });

    setSupabaseClientForTests({ from } as never);

    const row = await createBodegaExternaConfigurator({
      nombre: "Depósito Sur",
      capacidad: 150,
      idCreador: "user-1",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "MIT00",
        nombre: "Depósito Sur",
        tipo: "externa",
        capacidad_slots: 150,
        id_creador: "user-1",
        esta_activa: true,
      }),
    );
    expect(row).toEqual({
      idBodega: "bodega-2",
      nombre: "Depósito Sur",
      capacidad: 150,
      bodegaAsignada: "Mitre",
    });
  });
});
