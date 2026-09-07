import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  createCompradorProductoAliasAdmin,
  listCompradorProductoAliasAdmin,
  updateCompradorProductoAliasAdmin,
} from "./comprador-producto-alias.service";

describe("comprador-producto-alias.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("createCompradorProductoAliasAdmin inserta la relación sin tocar producto", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_alias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Patilla",
        precio: null,
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      alias: "  Patilla  ",
    });

    expect(from).toHaveBeenCalledWith("comprador_producto_alias");
    expect(insertChain.insert).toHaveBeenCalledWith({
      codigo_cuenta: "FOODS1",
      id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      alias: "Patilla",
      precio: null,
    });
    expect(row.alias).toBe("Patilla");
    expect(row.precioOverride).toBeNull();
  });

  it("createCompradorProductoAliasAdmin guarda precio override del comprador", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_alias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Patilla",
        precio: "110",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      alias: "Patilla",
      precio: 110,
    });

    expect(insertChain.insert).toHaveBeenCalledWith({
      codigo_cuenta: "FOODS1",
      id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      alias: "Patilla",
      precio: 110,
    });
    expect(row.precioOverride).toBe(110);
  });

  it("listCompradorProductoAliasAdmin junta alias con código, precio lista y override", async () => {
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
          precio: "110",
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
          descripcion: "BPNY FROZEN-BEEF PRIME NY STRIP",
          codigo_almacen: "DICOK",
          es_primario: true,
          es_secundario: false,
          unidad_visualizacion: "cantidad",
          id_producto_primario: null,
          metadatos_catalogo: {
            titulo: "BPNY FROZEN-BEEF PRIME NY STRIP",
            precio: "90",
          },
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
          precio: "96",
          fecha_aplicacion: "2026-07-11T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "comprador_producto_alias") return aliasChain;
      if (table === "producto") return productoChain;
      if (table === "precio_producto") return precioChain;
      throw new Error(`tabla inesperada: ${table}`);
    });
    setSupabaseClientForTests({ from } as never);

    const rows = await listCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(from).toHaveBeenCalledWith("comprador_producto_alias");
    expect(from).toHaveBeenCalledWith("producto");
    expect(from).toHaveBeenCalledWith("precio_producto");
    expect(rows).toEqual([
      {
        idAlias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Pollo asado",
        precioOverride: 110,
        codigoProducto: "DICOK",
        nombreProducto: "BPNY FROZEN-BEEF PRIME NY STRIP",
        precio: 110,
        precioLista: 96,
        unidad: "Cantidad (unidad)",
      },
    ]);
  });

  it("listCompradorProductoAliasAdmin usa lista default si no hay override", async () => {
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
          precio: null,
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
          metadatos_catalogo: { titulo: "BPNY" },
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
          precio: "96",
          fecha_aplicacion: "2026-07-11T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "comprador_producto_alias") return aliasChain;
      if (table === "producto") return productoChain;
      if (table === "precio_producto") return precioChain;
      throw new Error(`tabla inesperada: ${table}`);
    });
    setSupabaseClientForTests({ from } as never);

    const rows = await listCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(rows[0]?.precioOverride).toBeNull();
    expect(rows[0]?.precioLista).toBe(96);
    expect(rows[0]?.precio).toBe(96);
  });

  it("listCompradorProductoAliasAdmin no consulta productos si no hay alias", async () => {
    const aliasChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    aliasChain.select.mockReturnValue(aliasChain);
    aliasChain.eq.mockReturnValue(aliasChain);
    aliasChain.order.mockReturnValue(aliasChain);
    aliasChain.limit.mockResolvedValue({ data: [], error: null });

    const from = vi.fn((table: string) => {
      if (table === "comprador_producto_alias") return aliasChain;
      throw new Error(`tabla inesperada: ${table}`);
    });
    setSupabaseClientForTests({ from } as never);

    const rows = await listCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(rows).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("rechaza un alias vacío", async () => {
    await expect(
      createCompradorProductoAliasAdmin({
        codigoCuenta: "FOODS1",
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "   ",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
    });
  });

  it("avisa si el comprador ya tiene alias para ese producto", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: null,
      error: {
        message:
          'duplicate key value violates unique constraint "uq_comprador_producto_alias"',
      },
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    await expect(
      createCompradorProductoAliasAdmin({
        codigoCuenta: "FOODS1",
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Patilla",
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);

    await expect(
      createCompradorProductoAliasAdmin({
        codigoCuenta: "FOODS1",
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Patilla",
      }),
    ).rejects.toMatchObject({
      message: "Este comprador ya tiene una equivalencia para ese producto.",
    });
  });

  it("updateCompradorProductoAliasAdmin actualiza solo el texto de equivalencia", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: {
        id_alias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Pollo fresco",
        precio: null,
      },
      error: null,
    });

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const row = await updateCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idAlias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      alias: "  Pollo fresco  ",
    });

    expect(from).toHaveBeenCalledWith("comprador_producto_alias");
    expect(updateChain.update).toHaveBeenCalledWith({ alias: "Pollo fresco" });
    expect(row.alias).toBe("Pollo fresco");
  });

  it("updateCompradorProductoAliasAdmin puede guardar precio override", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: {
        id_alias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        id_comprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Pollo fresco",
        precio: "105",
      },
      error: null,
    });

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const row = await updateCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idAlias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      precio: 105,
    });

    expect(updateChain.update).toHaveBeenCalledWith({ precio: 105 });
    expect(row.precioOverride).toBe(105);
  });
});
