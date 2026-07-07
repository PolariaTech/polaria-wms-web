import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  mapSolicitudCompraEstadoN8n,
  SOLICITUD_COMPRA_N8N_MENSAJE_DEFAULT,
  type SolicitudCompraN8nBody,
} from "@/lib/solicitud-compra-n8n/solicitud-compra-n8n.schema";
import type { ProveedorListRow } from "@/modules/admin-panel";
import type { SolicitudCompraApiRow } from "../../shared/types/purchases-api.types";

export interface SolicitudCompraN8nLineaInput {
  idProducto: string;
  sku?: string;
  descripcion: string;
  cantidad: number;
}

export interface SolicitudCompraRouteResponse {
  ok: boolean;
  n8nStatus?: number;
  correlationId?: string;
  error?: string;
}

export interface BuildSolicitudCompraN8nInput {
  codigoCuenta: string;
  solicitud: SolicitudCompraApiRow;
  proveedor: Pick<
    ProveedorListRow,
    "idProveedor" | "proveedor" | "nombre" | "telefono"
  >;
  lineas: SolicitudCompraN8nLineaInput[];
  mensajeFinal?: string;
}

export function resolveProveedorRazonSocialN8n(
  proveedor: Pick<ProveedorListRow, "proveedor" | "nombre">,
): string {
  return proveedor.proveedor.trim() || proveedor.nombre.trim();
}

export function buildSolicitudCompraN8nBody(
  input: BuildSolicitudCompraN8nInput,
): SolicitudCompraN8nBody {
  const telefono = input.proveedor.telefono?.trim() ?? "";
  const razonSocial = resolveProveedorRazonSocialN8n(input.proveedor);

  if (!input.solicitud.idProveedor) {
    throw new DomainServiceError(
      "La solicitud no tiene proveedor asignado.",
      "INVALID_ARGUMENT",
    );
  }

  if (!telefono) {
    throw new DomainServiceError(
      "El proveedor no tiene teléfono registrado.",
      "INVALID_ARGUMENT",
    );
  }

  if (!razonSocial) {
    throw new DomainServiceError(
      "El proveedor no tiene razón social registrada.",
      "INVALID_ARGUMENT",
    );
  }

  return {
    codigo_cuenta: input.codigoCuenta.trim(),
    telefono,
    id_proveedor: input.solicitud.idProveedor,
    razon_social: razonSocial,
    codigo: input.solicitud.codigo,
    estado: mapSolicitudCompraEstadoN8n(input.solicitud.estado),
    solicitud_compra_linea: input.lineas.map((linea) => ({
      id_producto: linea.idProducto,
      sku: linea.sku?.trim() || "—",
      descripcion: linea.descripcion.trim(),
      cantidad: linea.cantidad,
    })),
    mensaje_final:
      input.mensajeFinal?.trim() || SOLICITUD_COMPRA_N8N_MENSAJE_DEFAULT,
  };
}

/** Notifica la solicitud de compra a n8n vía route handler interno. */
export async function notifySolicitudCompraN8n(
  body: SolicitudCompraN8nBody,
): Promise<SolicitudCompraRouteResponse> {
  let response: Response;

  try {
    response = await fetch("/api/solicitud-compra", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new DomainServiceError(
      "No se pudo contactar el servicio de notificación.",
      "MUTATION_FAILED",
    );
  }

  let data: SolicitudCompraRouteResponse;

  try {
    data = (await response.json()) as SolicitudCompraRouteResponse;
  } catch {
    throw new DomainServiceError(
      "Respuesta inválida del servicio de notificación.",
      "MUTATION_FAILED",
    );
  }

  if (!response.ok || !data.ok) {
    throw new DomainServiceError(
      data.error ?? "No se pudo notificar la solicitud de compra.",
      "MUTATION_FAILED",
    );
  }

  return data;
}
