import { requireCodigoCuenta, runDomainQuery } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  normalizeEstadoOrdenVenta,
  puedeAvanzarEstadoOrdenVenta,
  puedeBorrarOrdenVenta,
} from "../constants/sales-status";
import type { EstadoOrdenVenta } from "../types/sales.types";

/**
 * Soft-delete / cancelar (UI «Borrar»).
 * Siempre vía API Nest (canal B): libera reserva, OT y marca cancelada.
 */
export async function borrarOrdenVenta(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
}): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idOrdenVenta = params.idOrdenVenta.trim();
  if (!idOrdenVenta) {
    throw new DomainServiceError(
      "La orden de venta no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const existing = await runDomainQuery<{ estado: string } | null>(
    (client) => {
      const query = client
        .from("orden_venta")
        .select("estado")
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVenta)
        .maybeSingle();

      return query as unknown as Promise<{
        data: { estado: string } | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (!existing) {
    throw new DomainServiceError(
      "No se encontró la orden de venta.",
      "NOT_FOUND",
    );
  }

  if (!puedeBorrarOrdenVenta(existing.estado)) {
    throw new DomainServiceError(
      "Solo se pueden cancelar órdenes por confirmar, confirmadas o en alistamiento.",
      "MUTATION_FAILED",
    );
  }

  const { cancelarOrdenVentaApi } = await import("./sales-api.service");
  await cancelarOrdenVentaApi(idOrdenVenta);
}

/**
 * Avanza la OV solo a un estado posterior. No retrocede.
 * Mutación vía API Nest (canal B); Cypher solo lectura previa para UX.
 */
export async function avanzarEstadoOrdenVenta(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
  estado: EstadoOrdenVenta;
}): Promise<EstadoOrdenVenta> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idOrdenVenta = params.idOrdenVenta.trim();
  const destino = normalizeEstadoOrdenVenta(params.estado);
  if (!idOrdenVenta) {
    throw new DomainServiceError(
      "La orden de venta no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const existing = await runDomainQuery<{ estado: string } | null>(
    (client) => {
      const query = client
        .from("orden_venta")
        .select("estado")
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVenta)
        .maybeSingle();

      return query as unknown as Promise<{
        data: { estado: string } | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (!existing) {
    throw new DomainServiceError(
      "No se encontró la orden de venta.",
      "NOT_FOUND",
    );
  }

  if (!puedeAvanzarEstadoOrdenVenta(existing.estado, destino)) {
    throw new DomainServiceError(
      "Solo se puede pasar a un estado superior.",
      "MUTATION_FAILED",
    );
  }

  const { avanzarEstadoOrdenVentaApi } = await import("./sales-api.service");
  const row = await avanzarEstadoOrdenVentaApi(idOrdenVenta, destino);
  return normalizeEstadoOrdenVenta(row.estado);
}
