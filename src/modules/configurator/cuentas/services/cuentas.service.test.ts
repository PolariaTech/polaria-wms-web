import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { getCreationOptionHref } from "@/modules/configurator/shared/constants/creation-options";
import { apiRequest } from "@/services/api/api";
import {
  createCuentaConfigurator,
  listCuentasConfigurator,
  listEmpresasAssignOptions,
  updateCuentaConfigurator,
} from "./cuentas.service";

vi.mock("@/services/api/api", async () => {
  const actual = await vi.importActual<typeof import("@/services/api/api")>(
    "@/services/api/api",
  );
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe("creation-options", () => {
  it("cuentas resuelve a /configurador/creacion/cuentas", () => {
    expect(getCreationOptionHref("cuentas")).toBe(
      ROUTES.configuratorCreationAccounts,
    );
  });
});

describe("cuentas.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listCuentasConfigurator consulta tabla cuenta con relaciones", async () => {
    const { client, from } = createSupabaseMock({
      data: [
        {
          codigo_cuenta: "MIT00",
          codigo_empresa: "ACME",
          nombre_comercial: "Mitre",
          esta_activa: true,
          bodega: [
            {
              id_bodega: "bod-1",
              nombre: "Bodega Central",
              tipo: "interna",
              capacidad_slots: 120,
              esta_activa: true,
            },
          ],
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listCuentasConfigurator();

    expect(from).toHaveBeenCalledWith("cuenta");
    expect(rows).toEqual([
      {
        codigoCuenta: "MIT00",
        codigoEmpresa: "ACME",
        nombreComercial: "Mitre",
        bodegasAsignadas: [
          {
            idBodega: "bod-1",
            nombre: "Bodega Central",
            tipo: "interna",
            capacidad: 120,
          },
        ],
        bodegaInternaPrincipal: {
          idBodega: "bod-1",
          nombre: "Bodega Central",
          tipo: "interna",
          capacidad: 120,
        },
        estaActiva: true,
      },
    ]);
  });

  it("listEmpresasAssignOptions consulta empresas activas", async () => {
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
          codigo_empresa: "ACME",
          razon_social: "ACME Corp",
          telefono: "+57 300 111 2233",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listEmpresasAssignOptions();

    expect(from).toHaveBeenCalledWith("empresa");
    expect(selectChain.select).toHaveBeenCalledWith(
      "codigo_empresa,razon_social,telefono",
    );
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      {
        codigoEmpresa: "ACME",
        razonSocial: "ACME Corp",
        telefono: "+57 300 111 2233",
      },
    ]);
  });

  it("createCuentaConfigurator inserta en cuenta con empresa seleccionada", async () => {
    const insertChain = {
      insert: vi.fn(),
    };
    insertChain.insert.mockResolvedValue({
      data: { codigo_cuenta: "MIT00" },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createCuentaConfigurator({
      codigoCuenta: "MIT00",
      nombreComercial: "Mitre",
      codigoEmpresa: "ACME",
      idCreador: "user-1",
    });

    expect(from).toHaveBeenCalledWith("cuenta");
    expect(insertChain.insert).toHaveBeenCalledWith({
      codigo_cuenta: "MIT00",
      codigo_empresa: "ACME",
      nombre_comercial: "Mitre",
      id_creador: "user-1",
      esta_activa: true,
    });
    expect(row).toEqual({
      codigoCuenta: "MIT00",
      codigoEmpresa: "ACME",
      nombreComercial: "Mitre",
      bodegasAsignadas: [],
      bodegaInternaPrincipal: null,
      estaActiva: true,
    });
  });

  it("updateCuentaConfigurator llama PATCH /configuracion/cuentas/:codigo", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      codigoCuenta: "49M04",
      codigoEmpresa: "EVU53",
      nombreComercial: "Tecno-Tech",
      estaActiva: false,
    });

    const row = await updateCuentaConfigurator({
      codigoCuenta: "49M04",
      nombreComercial: "Tecno-Tech",
      estaActiva: false,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/configuracion/cuentas/49M04",
      expect.objectContaining({
        method: "PATCH",
        auth: true,
        body: {
          nombreComercial: "Tecno-Tech",
          estaActiva: false,
        },
      }),
    );
    expect(row.estaActiva).toBe(false);
  });
});
