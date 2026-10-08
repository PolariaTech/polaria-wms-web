import type { TipoAuditoria } from "@/modules/audit/types/audit.types";

/** Entrada de log lista para UI (orden de trabajo / OV). */
export interface OrdenVentaLogEntry {
  id: string;
  createdAt: string;
  accion: TipoAuditoria | "sintetico";
  mensaje: string;
  autor: string | null;
  /** OT hija (pedido+almacén). Null/omitido = evento de toda la OV. */
  idOrdenTrabajo: string | null;
}

export interface RecordOrdenVentaLogInput {
  idOrdenVenta: string;
  codigoCuenta: string;
  idBodega?: string | null;
  idUsuario?: string | null;
  accion: TipoAuditoria;
  mensaje: string;
  autorNombre?: string | null;
  /** Si se indica, el evento queda ligado a esa OT en el detalle. */
  idOrdenTrabajo?: string | null;
  payloadExtra?: Record<string, unknown>;
}
