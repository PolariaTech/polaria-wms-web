import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { getCreationOptionHref } from "../constants/creation-options";
import { listCuentasConfigurator } from "./cuentas.service";

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
});
