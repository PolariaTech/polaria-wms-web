import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { ApiError, apiRequest } from "@/services/api/api";
import { getCreationOptionHref } from "@/modules/configurator/shared/constants/creation-options";
import {
  createBodegaInternaConfigurator,
  listBodegasInternasConfigurator,
} from "./bodegas-internas.service";

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
    vi.mocked(apiRequest).mockResolvedValue(undefined);
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
    const cuentaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    cuentaChain.select.mockReturnValue(cuentaChain);
    cuentaChain.eq.mockReturnValue(cuentaChain);
    cuentaChain.limit.mockResolvedValue({
      data: [
        {
          codigo_cuenta: "MIT00",
          codigo_empresa: "ACME",
          nombre_comercial: "Mitre",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => cuentaChain);
    setSupabaseClientForTests({ from } as never);

    vi.mocked(apiRequest).mockImplementation(async (url) => {
      if (String(url).includes("bootstrap-layout")) {
        return undefined;
      }
      return { idBodega: "bodega-1", capacidadSlots: 80 };
    });

    const row = await createBodegaInternaConfigurator({
      nombre: "Central Norte",
      capacidad: 80,
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
          nombre: "Central Norte",
          tipo: "interna",
          capacidadSlots: 80,
        }),
      }),
    );
    expect(row).toEqual({
      idBodega: "bodega-1",
      nombre: "Central Norte",
      capacidad: 80,
      bodegaAsignada: "Mitre",
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/configuracion/bodegas/bodega-1/bootstrap-layout",
      expect.objectContaining({
        method: "POST",
        auth: true,
        headers: {
          "X-Codigo-Empresa": "ACME",
          "X-Codigo-Cuenta": "MIT00",
          "X-Id-Bodega": "bodega-1",
        },
      }),
    );
  });

  it("createBodegaInternaConfigurator propaga error de bootstrap sin revertir bodega", async () => {
    const cuentaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    cuentaChain.select.mockReturnValue(cuentaChain);
    cuentaChain.eq.mockReturnValue(cuentaChain);
    cuentaChain.limit.mockResolvedValue({
      data: [
        {
          codigo_cuenta: "MIT00",
          codigo_empresa: "ACME",
          nombre_comercial: "Mitre",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => cuentaChain);
    setSupabaseClientForTests({ from } as never);

    vi.mocked(apiRequest).mockImplementation(async (url) => {
      if (String(url).includes("bootstrap-layout")) {
        throw new ApiError("Error del servidor. Intenta de nuevo más tarde.", 500);
      }
      return { idBodega: "bodega-1", capacidadSlots: 80 };
    });

    await expect(
      createBodegaInternaConfigurator({
        nombre: "Central Norte",
        capacidad: 80,
        codigoCuenta: "MIT00",
        idCreador: "user-1",
      }),
    ).rejects.toMatchObject({
      message:
        "La bodega se creó, pero no se pudo inicializar el layout: Error del servidor. Intenta de nuevo más tarde.",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/configuracion/bodegas",
      expect.objectContaining({ method: "POST", auth: true }),
    );
    expect(apiRequest).toHaveBeenCalledWith(
      "/configuracion/bodegas/bodega-1/bootstrap-layout",
      expect.objectContaining({ method: "POST", auth: true }),
    );
  });
});
