import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { getCreationOptionHref } from "@/modules/configurator/shared/constants/creation-options";
import {
  createEmpresaConfigurator,
  listEmpresasConfigurator,
} from "./empresas.service";

describe("creation-options", () => {
  it("empresas resuelve a /configurador/creacion/empresas", () => {
    expect(getCreationOptionHref("empresas")).toBe(
      ROUTES.configuratorCreationCompanies,
    );
  });
});

describe("empresas.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listEmpresasConfigurator consulta tabla empresa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          codigo_empresa: "ACME0",
          razon_social: "ACME Corp",
          telefono: "+573001112233",
          esta_activa: true,
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listEmpresasConfigurator();

    expect(from).toHaveBeenCalledWith("empresa");
    expect(chain.order).toHaveBeenCalledWith("razon_social", { ascending: true });
    expect(rows).toEqual([
      {
        codigoEmpresa: "ACME0",
        razonSocial: "ACME Corp",
        telefono: "+573001112233",
        estaActiva: true,
      },
    ]);
  });

  it("createEmpresaConfigurator inserta en empresa con id_creador", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue({ data: [], error: null });

    const insertChain = {
      insert: vi.fn(),
    };
    insertChain.insert.mockResolvedValue({
      data: { codigo_empresa: "MIT00" },
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "empresa") {
        return {
          select: selectChain.select,
          insert: insertChain.insert,
        };
      }
      throw new Error(`Tabla inesperada: ${table}`);
    });
    setSupabaseClientForTests({ from } as never);

    const row = await createEmpresaConfigurator({
      codigoEmpresa: "MIT00",
      razonSocial: "Mitre S.A.",
      idCreador: "user-1",
    });

    expect(from).toHaveBeenCalledWith("empresa");
    expect(selectChain.eq).toHaveBeenCalledWith("codigo_empresa", "MIT00");
    expect(insertChain.insert).toHaveBeenCalledWith({
      codigo_empresa: "MIT00",
      razon_social: "Mitre S.A.",
      telefono: null,
      id_creador: "user-1",
      esta_activa: true,
    });
    expect(row).toEqual({
      codigoEmpresa: "MIT00",
      razonSocial: "Mitre S.A.",
      telefono: null,
      estaActiva: true,
    });
  });

  it("createEmpresaConfigurator rechaza código duplicado", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue({
      data: [{ codigo_empresa: "MIT00" }],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    await expect(
      createEmpresaConfigurator({
        codigoEmpresa: "MIT00",
        razonSocial: "Mitre S.A.",
      }),
    ).rejects.toMatchObject({
      message: "Ya existe una empresa con ese código.",
      code: "INVALID_ARGUMENT",
    } satisfies Partial<DomainServiceError>);
  });

  it("createEmpresaConfigurator valida razón social obligatoria", async () => {
    await expect(
      createEmpresaConfigurator({
        codigoEmpresa: "MIT00",
        razonSocial: "   ",
      }),
    ).rejects.toMatchObject({
      message: "La razón social es obligatoria.",
      code: "INVALID_ARGUMENT",
    } satisfies Partial<DomainServiceError>);
  });
});
