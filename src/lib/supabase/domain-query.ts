import type { SupabaseClient } from "@supabase/supabase-js";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isPlatformTable } from "@/lib/supabase/tenant-schema";

let clientOverride: SupabaseClient | null = null;
let schemaNameGetter: (() => string | null) | null = null;

/** Solo para tests: inyecta un cliente Supabase mock. */
export function setSupabaseClientForTests(client: SupabaseClient | null): void {
  clientOverride = client;
}

/** Registra cómo obtener el schema emp_* de la sesión activa.
 * Devuelve el getter anterior para poder restaurarlo.
 */
export function setTenantSchemaGetter(
  getter: (() => string | null) | null,
): (() => string | null) | null {
  const previous = schemaNameGetter;
  schemaNameGetter = getter;
  return previous;
}

export function getActiveTenantSchemaName(): string | null {
  return schemaNameGetter?.() ?? null;
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

/**
 * Query builder apuntando al schema correcto:
 * - tablas plataforma → public
 * - tablas negocio + schemaName en sesión → emp_*
 * - sin schemaName (legacy) → public
 *
 * Preferir runDomainQuery/Mutation: ya envuelven client.from automáticamente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function domainFrom(table: string): any {
  return wrapClientForTenant(getDomainSupabaseClient()).from(table);
}

export interface TenantListParams {
  codigoCuenta: string;
  idBodega?: string | null;
  limit?: number;
}

export const DEFAULT_LIST_LIMIT = 1000;
export const AUDIT_LIST_LIMIT = 25;
export const ORDERS_VISIBLE_DAYS = 7;

/** Fecha local YYYY-MM-DD desde la cual se listan órdenes (últimos N días). */
export function getOrdersVisibleSinceDate(
  days: number = ORDERS_VISIBLE_DAYS,
  now: Date = new Date(),
): string {
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  since.setDate(since.getDate() - days);
  const year = since.getFullYear();
  const month = String(since.getMonth() + 1).padStart(2, "0");
  const day = String(since.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Filtra listados de OV/OC a los últimos N días (importaciones viejas quedan fuera). */
export function applyRecentOrdersFilter(
  query: DomainSelectQuery,
  column: string,
  days: number = ORDERS_VISIBLE_DAYS,
): DomainSelectQuery {
  return query.gte(column, getOrdersVisibleSinceDate(days));
}

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

function wrapClientForTenant(client: SupabaseClient): SupabaseClient {
  const schemaName = getActiveTenantSchemaName();
  if (!schemaName) {
    return client;
  }

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          if (isPlatformTable(table)) {
            return target.from(table);
          }
          return target.schema(schemaName).from(table);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as SupabaseClient;
}

export async function runDomainQuery<T>(
  executor: (client: SupabaseClient) => Promise<SupabaseResult<T>>,
): Promise<T> {
  const client = wrapClientForTenant(getDomainSupabaseClient());
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

export async function runDomainMutation<T>(
  executor: (client: SupabaseClient) => Promise<SupabaseResult<T>>,
): Promise<T> {
  const client = wrapClientForTenant(getDomainSupabaseClient());
  const { data, error } = await executor(client);

  if (error) {
    throw new DomainServiceError(
      error.message || "Error al guardar en Supabase.",
      "MUTATION_FAILED",
      error,
    );
  }

  return data as T;
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
