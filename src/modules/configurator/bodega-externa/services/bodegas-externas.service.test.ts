import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { apiRequest } from "@/services/api/api";
import { getCreationOptionHref } from "@/modules/configurator/shared/constants/creation-options";
import {
  createBodegaExternaConfigurator,
  listBodegasExternasConfigurator,
} from "./bodegas-externas.service";

vi.mock("@/services/api/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
  apiRequest: vi.fn(),
}));

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
    vi.mocked(apiRequest).mockResolvedValue({ idBodega: "bodega-2", capacidadSlots: 150 });
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
    const cuentaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    cuentaChain.select.mockReturnValue(cuentaChain);
    cuentaChain.eq.mockReturnValue(cuentaChain);
    cuentaChain.limit.mockResolvedValue({
      data: [{ codigo_cuenta: "MIT00", nombre_comercial: "Mitre" }],
      error: null,
    });

    const from = vi.fn(() => cuentaChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createBodegaExternaConfigurator({
      nombre: "Depósito Sur",
      capacidad: 150,
      codigoCuenta: "MIT00",
      idCreador: "user-1",
    });

    expect(cuentaChain.eq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");

    expect(apiRequest).toHaveBeenCalledWith(
      "/configuracion/bodegas",
      expect.objectContaining({
        method: "POST",
        auth: true,
        body: expect.objectContaining({
          codigoCuenta: "MIT00",
          nombre: "Depósito Sur",
          tipo: "externa",
          capacidadSlots: 150,
        }),
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
