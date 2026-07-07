import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import {
  listBodegasExternasDisponiblesAdmin,
  listBodegasExternasVinculadasAdmin,
  vincularBodegaExternaAdmin,
} from "./bodegas-externas-admin.service";

describe("bodegas-externas-admin.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listBodegasExternasVinculadasAdmin consulta bodegas externas de la cuenta", async () => {
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
          nombre: "Bodega Externa Norte",
          codigo: "EXT01",
          codigo_cuenta: "MIT00",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listBodegasExternasVinculadasAdmin({ codigoCuenta: "MIT00" });

    expect(from).toHaveBeenCalledWith("bodega");
    expect(selectChain.eq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");
    expect(selectChain.eq).toHaveBeenCalledWith("tipo", "externa");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      {
        idBodega: "bodega-1",
        nombre: "Bodega Externa Norte",
        codigo: "EXT01",
      },
    ]);
  });

  it("listBodegasExternasDisponiblesAdmin excluye bodegas ya vinculadas", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      neq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.neq.mockReturnValue(selectChain);
    selectChain.order.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue({
      data: [
        {
          id_bodega: "bodega-2",
          nombre: "Bodega Externa Sur",
          codigo: "EXT02",
          codigo_cuenta: "OTRA01",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listBodegasExternasDisponiblesAdmin({
      codigoCuenta: "MIT00",
      codigoEmpresa: "ACME",
    });

    expect(selectChain.eq).toHaveBeenCalledWith("tipo", "externa");
    expect(selectChain.eq).toHaveBeenCalledWith("cuenta.codigo_empresa", "ACME");
    expect(selectChain.neq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");
    expect(rows).toEqual([
      {
        idBodega: "bodega-2",
        nombre: "Bodega Externa Sur",
        codigo: "EXT02",
        codigoCuenta: "OTRA01",
      },
    ]);
  });

  it("vincularBodegaExternaAdmin actualiza codigo_cuenta de la bodega", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: {
        id_bodega: "bodega-2",
        nombre: "Bodega Externa Sur",
        codigo: "EXT02",
        codigo_cuenta: "OTRA01",
        cuenta: { codigo_empresa: "ACME" },
      },
      error: null,
    });

    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockResolvedValue({ data: null, error: null });

    const from = vi
      .fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    setSupabaseClientForTests({ from } as never);

    const linked = await vincularBodegaExternaAdmin({
      codigoCuenta: "MIT00",
      codigoEmpresa: "ACME",
      idBodega: "bodega-2",
    });

    expect(updateChain.update).toHaveBeenCalledWith({ codigo_cuenta: "MIT00" });
    expect(updateChain.eq).toHaveBeenCalledWith("id_bodega", "bodega-2");
    expect(linked.nombre).toBe("Bodega Externa Sur");
  });
});
