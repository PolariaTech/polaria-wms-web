import { DEFAULT_LIST_LIMIT, requireCodigoCuenta, runDomainQuery } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

import { COMPRADOR_DETALLE_COLUMNS, COMPRADOR_LIST_COLUMNS, mapCompradorDetalle, mapCompradorRow, type CompradorDbRow, type CompradorDetalleRow, type CompradorListRow, type ListCompradoresParams } from "./compradores.service.types";

/** Lista compradores de la cuenta (scope tenant). */
export async function listCompradoresAdmin(
  params: ListCompradoresParams,
): Promise<CompradorListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const soloActivos = params.soloActivos !== false;

  const rows = await runDomainQuery<CompradorDbRow[]>((client) => {
    let query = client
      .from("comprador")
      .select(COMPRADOR_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta);

    if (soloActivos) {
      query = query.eq("esta_activo", true);
    }

    const finalQuery = query.order("nombre", { ascending: true }).limit(limit);

    return finalQuery as unknown as Promise<{
      data: CompradorDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapCompradorRow);
}

export interface GetCompradorParams {
  codigoCuenta: string;
  idComprador: string;
}

/** Detalle de un comprador activo, con ficha de alta. */
export async function getCompradorAdmin(
  params: GetCompradorParams,
): Promise<CompradorDetalleRow> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idComprador = params.idComprador.trim();

  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  const load = (columns: string) =>
    runDomainQuery<CompradorDbRow | null>((client) => {
      const query = client
        .from("comprador")
        .select(columns)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_comprador", idComprador)
        .eq("esta_activo", true)
        .maybeSingle();

      return query as unknown as Promise<{
        data: CompradorDbRow | null;
        error: { message: string } | null;
      }>;
    });

  const row = await load(COMPRADOR_DETALLE_COLUMNS);

  if (!row) {
    throw new DomainServiceError(
      "No se encontró el comprador.",
      "NOT_FOUND",
    );
  }

  return mapCompradorDetalle(row);
}
