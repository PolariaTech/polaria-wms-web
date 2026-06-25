import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/roles";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import {
  createUsuarioConfigurator,
  listBodegasAssignOptions,
  listUsuariosConfigurator,
} from "./usuarios.service";

vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: "http://localhost:3000" },
  getApiBaseUrl: () => "/api",
}));

describe("usuarios.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listUsuariosConfigurator consulta tabla usuario con rol y cuenta", async () => {
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
          id_usuario: "usr-1",
          username: "ADMIN01",
          codigo_cuenta: "MIT00",
          nombre: "Admin Demo",
          id_auth: "auth-1",
          rol: { id_rol: WmsRol.administrador_cuenta, nombre: "Administrador de cuenta" },
          cuenta: { nombre_comercial: "Mitre" },
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listUsuariosConfigurator();

    expect(from).toHaveBeenCalledWith("usuario");
    expect(selectChain.select).toHaveBeenCalledWith(
      "id_usuario,username,codigo_cuenta,nombre,id_auth,rol(id_rol,nombre),cuenta!fk_usuario_cuenta(nombre_comercial)",
    );
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows).toEqual([
      {
        idUsuario: "usr-1",
        codigo: "MIT00",
        rol: "Administrador de cuenta",
        nombre: "Admin Demo",
        cuenta: "Mitre",
        tieneCredenciales: true,
      },
    ]);
  });

  it("listBodegasAssignOptions consulta bodegas activas", async () => {
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
          codigo: "BOD01",
          codigo_cuenta: "MIT00",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listBodegasAssignOptions();

    expect(from).toHaveBeenCalledWith("bodega");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activa", true);
    expect(rows).toEqual([
      {
        idBodega: "bodega-1",
        nombre: "Central",
        codigo: "BOD01",
        codigoCuenta: "MIT00",
      },
    ]);
  });

  it("createUsuarioConfigurator envía idBodega para roles de bodega", async () => {
    const { setAccessTokenGetter } = await import("@/services/api");
    setAccessTokenGetter(() => "test-token");

    const rolChain = {
      select: vi.fn(),
      order: vi.fn(),
    };
    rolChain.select.mockReturnValue(rolChain);
    rolChain.order.mockResolvedValue({
      data: [{ id_rol: WmsRol.custodio, nombre: "Custodio" }],
      error: null,
    });

    const from = vi.fn(() => rolChain);
    setSupabaseClientForTests({ from } as never);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          idUsuario: "usr-2",
          username: "CUST01",
          nombre: "Custodio Demo",
          idRol: WmsRol.custodio,
          codigoCuenta: null,
          correo: "custodio@acme.com",
        }),
      }),
    );

    await createUsuarioConfigurator({
      codigo: "CUST01",
      nombre: "Custodio Demo",
      idRol: WmsRol.custodio,
      codigoCuenta: null,
      idBodega: "bodega-1",
      correo: "custodio@acme.com",
      clave: "secret1",
    });

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("/api/configurador/usuarios");
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      username: "CUST01",
      nombre: "Custodio Demo",
      idRol: WmsRol.custodio,
      codigoCuenta: null,
      codigoEmpresa: null,
      idBodega: "bodega-1",
      correo: "custodio@acme.com",
      password: "secret1",
    });
  });

  it("createUsuarioConfigurator resuelve codigoEmpresa para operador de cuenta", async () => {
    const { setAccessTokenGetter } = await import("@/services/api");
    setAccessTokenGetter(() => "test-token");

    let call = 0;
    const cuentaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    cuentaChain.select.mockReturnValue(cuentaChain);
    cuentaChain.eq.mockReturnValue(cuentaChain);
    cuentaChain.limit.mockResolvedValue({
      data: [{ codigo_empresa: "ACME" }],
      error: null,
    });

    const rolChain = {
      select: vi.fn(),
      order: vi.fn(),
    };
    rolChain.select.mockReturnValue(rolChain);
    rolChain.order.mockResolvedValue({
      data: [{ id_rol: WmsRol.operador_cuenta, nombre: "Operador de cuenta" }],
      error: null,
    });

    const cuentasChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    cuentasChain.select.mockReturnValue(cuentasChain);
    cuentasChain.eq.mockReturnValue(cuentasChain);
    cuentasChain.order.mockReturnValue(cuentasChain);
    cuentasChain.limit.mockResolvedValue({
      data: [{ codigo_cuenta: "MIT00", nombre_comercial: "Mitre" }],
      error: null,
    });

    const from = vi.fn(() => {
      call += 1;
      if (call === 1) return cuentaChain;
      if (call === 2) return rolChain;
      return cuentasChain;
    });
    setSupabaseClientForTests({ from } as never);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          idUsuario: "usr-3",
          username: "OPER01",
          nombre: "Operador Demo",
          idRol: WmsRol.operador_cuenta,
          codigoCuenta: "MIT00",
          correo: "operador@acme.com",
        }),
      }),
    );

    await createUsuarioConfigurator({
      codigo: "OPER01",
      nombre: "Operador Demo",
      idRol: WmsRol.operador_cuenta,
      codigoCuenta: "MIT00",
      idBodega: null,
      correo: "operador@acme.com",
      clave: "secret1",
    });

    const apiCall = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(apiCall[1]?.body))).toMatchObject({
      codigoCuenta: "MIT00",
      codigoEmpresa: "ACME",
      idBodega: null,
    });
  });

  it("createUsuarioConfigurator envía nulls para transportista y configurador", async () => {
    const { setAccessTokenGetter } = await import("@/services/api");
    setAccessTokenGetter(() => "test-token");

    const rolChain = {
      select: vi.fn(),
      order: vi.fn(),
    };
    rolChain.select.mockReturnValue(rolChain);
    rolChain.order.mockResolvedValue({
      data: [{ id_rol: WmsRol.transportista, nombre: "Transportista" }],
      error: null,
    });

    const from = vi.fn(() => rolChain);
    setSupabaseClientForTests({ from } as never);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          idUsuario: "usr-4",
          username: "TRAN01",
          nombre: "Transportista Demo",
          idRol: WmsRol.transportista,
          codigoCuenta: null,
          correo: "trans@acme.com",
        }),
      }),
    );

    await createUsuarioConfigurator({
      codigo: "TRAN01",
      nombre: "Transportista Demo",
      idRol: WmsRol.transportista,
      codigoCuenta: null,
      idBodega: null,
      correo: "trans@acme.com",
      clave: "secret1",
    });

    const apiCall = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(apiCall[1]?.body))).toMatchObject({
      codigoCuenta: null,
      codigoEmpresa: null,
      idBodega: null,
    });
  });
});
