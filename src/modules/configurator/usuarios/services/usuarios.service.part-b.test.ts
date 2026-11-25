import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createUsuarioConfigurator } from "./usuarios.service";

vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: "http://localhost:3000" },
  getApiBaseUrl: () => "/api",
}));
describe("usuarios.service", () => {
  beforeEach(() => {
  setSupabaseClientForTests(null);
  vi.restoreAllMocks();
  });
  it("createUsuarioConfigurator envía nulls para configurador", async () => {
  const { setAccessTokenGetter } = await import("@/services/api/api");
  setAccessTokenGetter(() => "test-token");

  const rolChain = {
  select: vi.fn(),
  order: vi.fn(),
  };
  rolChain.select.mockReturnValue(rolChain);
  rolChain.order.mockResolvedValue({
  data: [{ id_rol: WmsRol.configurador, nombre: "Configurador" }],
  error: null,
  });

  const from = vi.fn(() => rolChain);
  setSupabaseClientForTests({ from, schema: vi.fn(() => ({ from })) } as never);

  vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
  ok: true,
  status: 201,
  json: async () => ({
  idUsuario: "usr-4",
  username: "CONF01",
  nombre: "Config Demo",
  idRol: WmsRol.configurador,
  codigoCuenta: null,
  correo: "conf@acme.com",
  }),
  }),
  );

  await createUsuarioConfigurator({
  codigo: "CONF01",
  nombre: "Config Demo",
  idRol: WmsRol.configurador,
  codigoCuenta: null,
  idBodega: null,
  correo: "conf@acme.com",
  clave: "Secret1!a",
  });

  const apiCall = vi.mocked(fetch).mock.calls[0];
  expect(JSON.parse(String(apiCall[1]?.body))).toMatchObject({
  codigoCuenta: null,
  codigoEmpresa: null,
  idBodega: null,
  });
  });

  it("createUsuarioConfigurator envía idBodega y cuenta para transportista", async () => {
  const { setAccessTokenGetter } = await import("@/services/api/api");
  setAccessTokenGetter(() => "test-token");

  const bodegaLookupChain = {
  select: vi.fn(),
  eq: vi.fn(),
  limit: vi.fn(),
  };
  bodegaLookupChain.select.mockReturnValue(bodegaLookupChain);
  bodegaLookupChain.eq.mockImplementation(function (this: typeof bodegaLookupChain) {
  return bodegaLookupChain;
  });
  bodegaLookupChain.limit.mockResolvedValue({
  data: [
  {
  id_bodega: "550e8400-e29b-41d4-a716-446655440000",
  codigo_cuenta: "MIT00",
  },
  ],
  error: null,
  });

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

  const rolChain = {
  select: vi.fn(),
  order: vi.fn(),
  };
  rolChain.select.mockReturnValue(rolChain);
  rolChain.order.mockResolvedValue({
  data: [{ id_rol: WmsRol.transportista, nombre: "Transportista" }],
  error: null,
  });

  let call = 0;
  const from = vi.fn(() => {
  call += 1;
  if (call === 1) return bodegaLookupChain;
  if (call === 2) return cuentaChain;
  if (call === 3) return rolChain;
  return cuentasChain;
  });
  setSupabaseClientForTests({ from, schema: vi.fn(() => ({ from })) } as never);

  vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
  ok: true,
  status: 201,
  json: async () => ({
  idUsuario: "usr-5",
  username: "TRAN01",
  nombre: "Transportista Demo",
  idRol: WmsRol.transportista,
  codigoCuenta: "MIT00",
  correo: "trans@acme.com",
  }),
  }),
  );

  await createUsuarioConfigurator({
  codigo: "TRAN01",
  nombre: "Transportista Demo",
  idRol: WmsRol.transportista,
  codigoCuenta: "MIT00",
  idBodega: "550e8400-e29b-41d4-a716-446655440000",
  correo: "trans@acme.com",
  clave: "Secret1!a",
  });

  const apiCall = vi.mocked(fetch).mock.calls[0];
  expect(JSON.parse(String(apiCall[1]?.body))).toMatchObject({
  codigoCuenta: "MIT00",
  codigoEmpresa: "ACME",
  idBodega: "550e8400-e29b-41d4-a716-446655440000",
  });
  });
});