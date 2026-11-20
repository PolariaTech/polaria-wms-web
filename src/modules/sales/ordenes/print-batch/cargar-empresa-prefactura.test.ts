import { beforeEach, describe, expect, it, vi } from "vitest";

const consultar = vi.fn();

vi.mock("@/lib/supabase/domain-query", () => ({
  runDomainQuery: async (ejecutar: (client: unknown) => Promise<{ data: unknown; error: { message: string } | null }>) => {
    const resultado = await ejecutar({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: () => consultar() }),
        }),
      }),
    });
    if (resultado.error) throw new Error(resultado.error.message);
    return resultado.data;
  },
}));

import { cargarEmpresaPrefactura } from "./cargar-empresa-prefactura";

const ficha = {
  razon_social: "Aguacates de puebla",
  rfc: "APU210325668",
  regimen_fiscal: "601",
  codigo_postal_expedicion: "77560",
  nombre_cuenta_bancaria: "Aguacates de Puebla",
  banco: "BBVA",
  clabe: "012528001186364430",
  correo_cobranza: "cobranza@aguacatesdepuebla.com",
  serie_factura: "CS-",
  logo_path: null as string | null,
};

beforeEach(() => {
  consultar.mockReset();
  consultar.mockResolvedValue({ data: ficha, error: null });
});

describe("cargarEmpresaPrefactura", () => {
  it("lee la ficha y no pide el logo si todavía no hay archivo", async () => {
    const bajarLogo = vi.fn();

    const empresa = await cargarEmpresaPrefactura("Y9IHZ", bajarLogo);

    expect(empresa.razonSocial).toBe("Aguacates de puebla");
    expect(empresa.logo).toBeNull();
    expect(bajarLogo).not.toHaveBeenCalled();
  });

  it("baja el logo cuando la empresa ya tiene ruta", async () => {
    consultar.mockResolvedValue({ data: { ...ficha, logo_path: "Y9IHZ/logo.png" }, error: null });
    const bajarLogo = vi.fn().mockResolvedValue({ bytes: new Uint8Array([1]), formato: "PNG" });

    const empresa = await cargarEmpresaPrefactura("Y9IHZ", bajarLogo);

    expect(bajarLogo).toHaveBeenCalledWith("Y9IHZ/logo.png");
    expect(empresa.logo?.formato).toBe("PNG");
  });

  it("avisa si la empresa no existe", async () => {
    consultar.mockResolvedValue({ data: null, error: null });

    await expect(cargarEmpresaPrefactura("NOPE")).rejects.toThrow("No se encontró la empresa");
  });
});
