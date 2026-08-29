import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { createCompradorProductoAliasAdmin, listCompradorProductoAliasAdmin } from "./comprador-producto-alias.service";

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
    });
    expect(row.alias).toBe("Patilla");
  });

  it("listCompradorProductoAliasAdmin junta alias con código y nombre del producto", async () => {
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
        },
      ],
      error: null,
    });

    const productoChain = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      limit: vi.fn(),
    };
    productoChain.select.mockReturnValue(productoChain);
    productoChain.eq.mockReturnValue(productoChain);
    productoChain.in.mockReturnValue(productoChain);
    productoChain.limit.mockResolvedValue({
      data: [
        {
          id_producto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          sku: "SKU-BEEF",
          descripcion: "BPNY FROZEN-BEEF PRIME NY STRIP",
          codigo_almacen: "DICOK",
        },
      ],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "comprador_producto_alias") return aliasChain;
      if (table === "producto") return productoChain;
      throw new Error(`tabla inesperada: ${table}`);
    });
    setSupabaseClientForTests({ from } as never);

    const rows = await listCompradorProductoAliasAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(from).toHaveBeenCalledWith("comprador_producto_alias");
    expect(from).toHaveBeenCalledWith("producto");
    expect(aliasChain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(aliasChain.eq).toHaveBeenCalledWith(
      "id_comprador",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    );
    expect(productoChain.in).toHaveBeenCalledWith("id_producto", [
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
    ]);
    expect(rows).toEqual([
      {
        idAlias: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        idProducto: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        alias: "Pollo asado",
        codigoProducto: "DICOK",
        nombreProducto: "BPNY FROZEN-BEEF PRIME NY STRIP",
      },
    ]);
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
      message: "Este comprador ya tiene un alias para ese producto.",
    });
  });
});
