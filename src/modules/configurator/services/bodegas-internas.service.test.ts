import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { getCreationOptionHref } from "../constants/creation-options";
import {
  createBodegaInternaConfigurator,
  listBodegasInternasConfigurator,
} from "./bodegas-internas.service";

describe("creation-options bodega interna", () => {
  it("resuelve ruta de bodega interna", () => {
    expect(getCreationOptionHref("bodega-interna")).toBe(
      ROUTES.configuratorCreationInternalWarehouse,
    );
  });
});

describe("bodegas-internas.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listBodegasInternasConfigurator filtra tipo interna", async () => {
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
          id_bodega: "bodega-1",
          nombre: "Central",
          capacidad_slots: 120,
          cuenta: { nombre_comercial: "Mitre" },
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listBodegasInternasConfigurator();

    expect(from).toHaveBeenCalledWith("bodega");
    expect(selectChain.eq).toHaveBeenCalledWith("tipo", "interna");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      {
        idBodega: "bodega-1",
        nombre: "Central",
        capacidad: 120,
        bodegaAsignada: "Mitre",
      },
    ]);
  });

  it("createBodegaInternaConfigurator inserta bodega interna", async () => {
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
      data: { id_bodega: "bodega-1" },
      error: null,
    });

    const from = vi.fn(() => {
      call += 1;
      return call === 1 ? cuentaChain : insertChain;
    });

    setSupabaseClientForTests({ from } as never);

    const row = await createBodegaInternaConfigurator({
      nombre: "Central Norte",
      capacidad: 80,
      idCreador: "user-1",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "MIT00",
        nombre: "Central Norte",
        tipo: "interna",
        capacidad_slots: 80,
        id_creador: "user-1",
        esta_activa: true,
      }),
    );
    expect(row).toEqual({
      idBodega: "bodega-1",
      nombre: "Central Norte",
      capacidad: 80,
      bodegaAsignada: "Mitre",
    });
  });
});
