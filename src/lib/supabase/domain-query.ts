import type { SupabaseClient } from "@supabase/supabase-js";
import { DomainServiceError } from "@/lib/domain-service-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

let clientOverride: SupabaseClient | null = null;

/** Solo para tests: inyecta un cliente Supabase mock. */
export function setSupabaseClientForTests(client: SupabaseClient | null): void {
  clientOverride = client;
}

export function getDomainSupabaseClient(): SupabaseClient {
  if (clientOverride) {
    return clientOverride;
  }

  try {
    return createSupabaseBrowserClient();
  } catch (error) {
    throw new DomainServiceError(
      "Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      "SUPABASE_NOT_CONFIGURED",
      error,
    );
  }
}

export interface TenantListParams {
  codigoCuenta: string;
  idBodega?: string | null;
  limit?: number;
}

export const DEFAULT_LIST_LIMIT = 50;
export const AUDIT_LIST_LIMIT = 25;

export function requireCodigoCuenta(codigoCuenta: string | null | undefined): string {
  if (!codigoCuenta?.trim()) {
    throw new DomainServiceError(
      "Falta codigo_cuenta del tenant activo.",
      "TENANT_CONTEXT_MISSING",
    );
  }

  return codigoCuenta;
}

export function requireIdBodega(idBodega: string | null | undefined): string {
  if (!idBodega?.trim()) {
    throw new DomainServiceError(
      "Falta id_bodega del tenant activo.",
      "TENANT_CONTEXT_MISSING",
    );
  }

  return idBodega;
}

type SupabaseResult<T> = { data: T | null; error: { message: string } | null };

export async function runDomainQuery<T>(
  executor: (client: SupabaseClient) => Promise<SupabaseResult<T>>,
): Promise<T> {
  const client = getDomainSupabaseClient();
  const { data, error } = await executor(client);

  if (error) {
    throw new DomainServiceError(
      error.message || "Error al consultar Supabase.",
      "QUERY_FAILED",
      error,
    );
  }

  return (data ?? []) as T;
}

/** Evita inferencia recursiva del query builder de Supabase en build. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DomainSelectQuery = any;

export function applyTenantFilters(
  query: DomainSelectQuery,
  params: TenantListParams,
  options?: { bodegaRequired?: boolean },
): DomainSelectQuery {
  let next = query.eq("codigo_cuenta", requireCodigoCuenta(params.codigoCuenta));

  if (options?.bodegaRequired) {
    next = next.eq("id_bodega", requireIdBodega(params.idBodega));
  } else if (params.idBodega) {
    next = next.eq("id_bodega", params.idBodega);
  }

  return next;
}
