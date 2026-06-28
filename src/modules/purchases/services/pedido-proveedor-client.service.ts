import { DomainServiceError } from "@/lib/domain-service-error";
import type { PedidoProveedorBody } from "@/lib/pedido-proveedor/pedido-proveedor.schema";
import type { OrdenCompraRow } from "../types/purchases.types";
import type { OrdenCompraLineaRow } from "./purchases.service";

export interface PedidoProveedorRouteResponse {
  ok: boolean;
  n8nStatus?: number;
  correlationId?: string;
  error?: string;
}

export function buildPedidoProveedorRequest(
  orden: OrdenCompraRow,
  lineas: OrdenCompraLineaRow[],
): PedidoProveedorBody {
  const observacionesParts = [
    orden.observaciones?.trim(),
    `OC ${orden.codigo}`,
  ].filter(Boolean);

  return {
    idOrdenCompra: orden.id_orden_compra,
    idProveedor: orden.id_proveedor,
    lineas: lineas.map((linea) => ({
      sku: linea.sku,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
    })),
    ...(observacionesParts.length
      ? { observaciones: observacionesParts.join(" — ") }
      : {}),
  };
}

/** Notifica al proveedor vía route handler interno (n8n). */
export async function notifyProveedorPedido(
  input: PedidoProveedorBody,
): Promise<PedidoProveedorRouteResponse> {
  let response: Response;

  try {
    response = await fetch("/api/pedido-proveedor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new DomainServiceError(
      "No se pudo contactar el servicio de notificación.",
      "MUTATION_FAILED",
    );
  }

  let data: PedidoProveedorRouteResponse;

  try {
    data = (await response.json()) as PedidoProveedorRouteResponse;
  } catch {
    throw new DomainServiceError(
      "Respuesta inválida del servicio de notificación.",
      "MUTATION_FAILED",
    );
  }

  if (!response.ok || !data.ok) {
    throw new DomainServiceError(
      data.error ?? "No se pudo notificar al proveedor.",
      "MUTATION_FAILED",
    );
  }

  return data;
}
