import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { getCreationOptionHref } from "../constants/creation-options";
import {
  createCuentaConfigurator,
  listCuentasConfigurator,
  listEmpresasAssignOptions,
} from "./cuentas.service";

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
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          codigo_cuenta: "MIT00",
          nombre_comercial: "Mitre",
          bodega: [{ nombre: "Bodega Central", esta_activa: true }],
          usuario: [{ esta_activo: true }],
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listCuentasConfigurator();

    expect(from).toHaveBeenCalledWith("cuenta");
    expect(chain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      {
        codigoCuenta: "MIT00",
        nombreComercial: "Mitre",
        bodegaAsignada: "Bodega Central",
        tieneCredenciales: true,
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
      data: [{ codigo_empresa: "ACME", razon_social: "ACME Corp" }],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listEmpresasAssignOptions();

    expect(from).toHaveBeenCalledWith("empresa");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      { codigoEmpresa: "ACME", razonSocial: "ACME Corp" },
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
      nombreComercial: "Mitre",
      bodegaAsignada: "—",
      tieneCredenciales: false,
    });
  });
});
