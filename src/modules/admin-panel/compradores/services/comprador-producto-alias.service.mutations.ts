import { requireCodigoCuenta, runDomainMutation } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { MENSAJE_COMPRADOR_NO_ENCONTRADO, MENSAJE_CUENTA_NO_ENCONTRADA, mensajeValidacionAliasPrecio, traducirErrorAlias } from "../utils/comprador-alias-reglas";

import { ALIAS_COLUMNS, mapAliasRow, type CompradorProductoAliasDbRow, type CompradorProductoAliasRow } from "./comprador-producto-alias.service.types";

export interface CreateCompradorProductoAliasInput {
  codigoCuenta: string;
  idComprador: string;
  idProducto: string;
  alias: string;
  /** Si se omite o es null, el comprador usa la lista de precios. */
  precio?: number | null;
  codigoProducto?: string;
}

/** Guarda equivalencia (nombre/precio) solo para ese comprador. */
export async function createCompradorProductoAliasAdmin(
  input: CreateCompradorProductoAliasInput,
): Promise<CompradorProductoAliasRow> {
  if (!input.codigoCuenta?.trim()) {
    throw new DomainServiceError(MENSAJE_CUENTA_NO_ENCONTRADA, "INVALID_ARGUMENT");
  }
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  const idProducto = input.idProducto.trim();
  const alias = input.alias.trim();
  const precio =
    input.precio === undefined || input.precio === null
      ? null
      : input.precio;

  if (!idComprador) {
    throw new DomainServiceError(MENSAJE_COMPRADOR_NO_ENCONTRADO, "INVALID_ARGUMENT");
  }

  if (!idProducto) {
    throw new DomainServiceError(
      "Selecciona un producto del catálogo.",
      "INVALID_ARGUMENT",
    );
  }

  const errorValidacion = mensajeValidacionAliasPrecio(
    alias,
    precio,
    input.codigoProducto,
  );
  if (errorValidacion) {
    throw new DomainServiceError(errorValidacion, "INVALID_ARGUMENT");
  }

  try {
    const inserted = await runDomainMutation<CompradorProductoAliasDbRow | null>(
      (client) => {
        const query = client
          .from("comprador_producto_alias")
          .insert({
            codigo_cuenta: codigoCuenta,
            id_comprador: idComprador,
            id_producto: idProducto,
            alias,
            precio,
          })
          .select(ALIAS_COLUMNS)
          .single();

        return query as unknown as Promise<{
          data: CompradorProductoAliasDbRow | null;
          error: { message: string } | null;
        }>;
      },
    );

    if (!inserted) {
      throw new DomainServiceError(
        "No se pudo guardar la equivalencia.",
        "MUTATION_FAILED",
      );
    }

    return mapAliasRow(inserted);
  } catch (error: unknown) {
    const mensaje = traducirErrorAlias(error);
    if (mensaje) {
      throw new DomainServiceError(mensaje, "INVALID_ARGUMENT", error);
    }
    throw error;
  }
}

export interface UpdateCompradorProductoAliasInput {
  codigoCuenta: string;
  idAlias: string;
  alias?: string;
  /** undefined = no tocar; null = volver a lista default. */
  precio?: number | null;
  codigoProducto?: string;
}

/** Actualiza equivalencia y/o precio override del comprador. */
export async function updateCompradorProductoAliasAdmin(
  input: UpdateCompradorProductoAliasInput,
): Promise<CompradorProductoAliasRow> {
  if (!input.codigoCuenta?.trim()) {
    throw new DomainServiceError(MENSAJE_CUENTA_NO_ENCONTRADA, "INVALID_ARGUMENT");
  }
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idAlias = input.idAlias.trim();
  const hasAlias = input.alias !== undefined;
  const hasPrecio = input.precio !== undefined;

  if (!idAlias) {
    throw new DomainServiceError(
      "Falta el identificador de la equivalencia.",
      "INVALID_ARGUMENT",
    );
  }

  if (!hasAlias && !hasPrecio) {
    throw new DomainServiceError(
      "No hay cambios para guardar.",
      "INVALID_ARGUMENT",
    );
  }

  const payload: { alias?: string; precio?: number | null } = {};
  const alias = hasAlias ? (input.alias ?? "").trim() : "";
  const errorValidacion = mensajeValidacionAliasPrecio(
    alias,
    hasPrecio ? input.precio : null,
    input.codigoProducto,
  );
  if (errorValidacion) {
    throw new DomainServiceError(errorValidacion, "INVALID_ARGUMENT");
  }
  if (hasAlias) payload.alias = alias;
  if (hasPrecio) payload.precio = input.precio ?? null;

  try {
    const updated = await runDomainMutation<CompradorProductoAliasDbRow | null>(
      (client) => {
        const query = client
          .from("comprador_producto_alias")
          .update(payload)
          .eq("codigo_cuenta", codigoCuenta)
          .eq("id_alias", idAlias)
          .select(ALIAS_COLUMNS)
          .single();

        return query as unknown as Promise<{
          data: CompradorProductoAliasDbRow | null;
          error: { message: string } | null;
        }>;
      },
    );

    if (!updated) {
      throw new DomainServiceError(
        "No se pudo actualizar la equivalencia.",
        "MUTATION_FAILED",
      );
    }

    return mapAliasRow(updated);
  } catch (error: unknown) {
    const mensaje = traducirErrorAlias(error);
    if (mensaje) {
      throw new DomainServiceError(mensaje, "INVALID_ARGUMENT", error);
    }
    throw error;
  }
}

