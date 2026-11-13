import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  mensajeFraseLarga,
  mensajePrecioInvalido,
  mensajeValidacionAliasPrecio,
} from "../utils/comprador-alias-reglas";
import { createCompradorProductoAliasAdmin } from "./comprador-producto-alias.service";

const ID_COMPRADOR = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ID_PRODUCTO = "cccccccc-cccc-cccc-cccc-cccccccccccc";

function entrada(alias: string, extra?: { precio?: number; codigoProducto?: string }) {
  return {
    codigoCuenta: "FOODS1",
    idComprador: ID_COMPRADOR,
    idProducto: ID_PRODUCTO,
    alias,
    ...extra,
  };
}

describe("comprador-producto-alias.service validación", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("acepta 255 caracteres", async () => {
    const alias = "a".repeat(255);
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
        id_comprador: ID_COMPRADOR,
        id_producto: ID_PRODUCTO,
        alias,
        precio: null,
      },
      error: null,
    });
    setSupabaseClientForTests({ from: vi.fn(() => insertChain) } as never);

    const row = await createCompradorProductoAliasAdmin(
      entrada(alias, { codigoProducto: "DICOK" }),
    );
    expect(row.alias).toHaveLength(255);
    expect(insertChain.insert).toHaveBeenCalled();
  });

  it("rechaza 256 caracteres con el mismo texto que el modal", async () => {
    const alias = "a".repeat(256);
    const mensaje = mensajeFraseLarga("DICOK");
    expect(mensajeValidacionAliasPrecio(alias, null, "DICOK")).toBe(mensaje);
    await expect(
      createCompradorProductoAliasAdmin(
        entrada(alias, { codigoProducto: "DICOK" }),
      ),
    ).rejects.toMatchObject({
      message: mensaje,
    });
    await expect(
      createCompradorProductoAliasAdmin(
        entrada(alias, { codigoProducto: "DICOK" }),
      ),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });

  it("rechaza precio -1 con el mismo texto que el modal", async () => {
    const mensaje = mensajePrecioInvalido("DICOK");
    expect(mensajeValidacionAliasPrecio("Pechuga", -1, "DICOK")).toBe(mensaje);
    await expect(
      createCompradorProductoAliasAdmin(
        entrada("Pechuga", { precio: -1, codigoProducto: "DICOK" }),
      ),
    ).rejects.toMatchObject({ message: mensaje });
  });
});
