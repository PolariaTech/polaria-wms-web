import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  createCompradorProductoAliasAdmin,
  listCompradorPreciosTemplateAdmin,
  listCompradorProductoAliasAdmin,
  listCompradorProductoAliasCuentaAdmin,
  updateCompradorProductoAliasAdmin,
} from "./comprador-producto-alias.service";
describe("comprador-producto-alias.service", () => {
  beforeEach(() => {
  setSupabaseClientForTests(null);
  vi.restoreAllMocks();
  });
  it("listCompradorPreciosTemplateAdmin incluye todo el catálogo aunque no haya equivalencia", async () => {
  const aliasChain = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  };
  aliasChain.select.mockReturnValue(aliasChain);
  aliasChain.eq.mockReturnValue(aliasChain);
  aliasChain.order.mockReturnValue(aliasChain);
  aliasChain.limit.mockResolvedValue({
  data: [
  {
  id_alias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  alias: "Pollo asado",
  precio: "50",
  },
  ],
  error: null,
  });

  const productoChain = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  in: vi.fn(),
  };
  productoChain.select.mockReturnValue(productoChain);
  productoChain.eq.mockReturnValue(productoChain);
  productoChain.order.mockReturnValue(productoChain);
  productoChain.in.mockReturnValue(productoChain);
  productoChain.limit.mockResolvedValue({
  data: [
  {
  id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  sku: "SKU-BEEF",
  descripcion: "BPNY",
  codigo_almacen: "DICOK",
  es_primario: true,
  es_secundario: false,
  unidad_visualizacion: "cantidad",
  id_producto_primario: null,
  metadatos_catalogo: { titulo: "Pollo entero", tipo_producto: 1 },
  },
  {
  id_producto: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  sku: "SKU-HAM",
  descripcion: "HAM",
  codigo_almacen: "OGHK6",
  es_primario: true,
  es_secundario: false,
  unidad_visualizacion: "cantidad",
  id_producto_primario: null,
  metadatos_catalogo: { titulo: "Hamburguesa", tipo_producto: 1 },
  },
  ],
  error: null,
  });

  const precioChain = {
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  };
  precioChain.select.mockReturnValue(precioChain);
  precioChain.eq.mockReturnValue(precioChain);
  precioChain.in.mockReturnValue(precioChain);
  precioChain.order.mockReturnValue(precioChain);
  precioChain.limit.mockResolvedValue({
  data: [
  {
  id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  precio: "40",
  fecha_aplicacion: "2026-07-11T00:00:00.000Z",
  },
  {
  id_producto: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  precio: "20",
  fecha_aplicacion: "2026-07-11T00:00:00.000Z",
  },
  ],
  error: null,
  });

  const compradorChain = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  };
  compradorChain.select.mockReturnValue(compradorChain);
  compradorChain.eq.mockReturnValue(compradorChain);
  compradorChain.order.mockReturnValue(compradorChain);
  compradorChain.limit.mockResolvedValue({
  data: [
  {
  id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  codigo: "WAL01",
  nombre: "Walmart",
  telefono: null,
  grupo: "Grupo A",
  esta_activo: true,
  },
  ],
  error: null,
  });

  const from = vi.fn((table: string) => {
  if (table === "comprador_producto_alias") return aliasChain;
  if (table === "producto") return productoChain;
  if (table === "precio_producto") return precioChain;
  if (table === "comprador") return compradorChain;
  throw new Error(`tabla inesperada: ${table}`);
  });
  setSupabaseClientForTests({ from } as never);

  const rows = await listCompradorPreciosTemplateAdmin({
  codigoCuenta: "FOODS1",
  });

  expect(rows).toHaveLength(2);
  expect(rows).toEqual(
  expect.arrayContaining([
  {
  grupo: "Grupo A",
  codigoComprador: "WAL01",
  nombreComprador: "Walmart",
  codigoProducto: "DICOK",
  nombreProducto: "Pollo entero",
  equivalencia: "Pollo asado",
  precioActual: 40,
  precioNuevo: 50,
  },
  {
  grupo: "Grupo A",
  codigoComprador: "WAL01",
  nombreComprador: "Walmart",
  codigoProducto: "OGHK6",
  nombreProducto: "Hamburguesa",
  equivalencia: "",
  precioActual: 20,
  precioNuevo: null,
  },
  ]),
  );
  });
});