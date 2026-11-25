import { MENSAJE_VERSION_NUEVA } from "../../print/print-correo-fallo";
import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../../shared/types/sales.types";
import type {
  OrdenVentaFotoCapturaItem,
  OrdenVentaOtConFotosItem,
} from "../modals/OrdenVentaFotosCapturaModal";
import type { AccionSobreOt } from "../modals/OrdenVentaSeleccionOtModal";

/** Ejecuta `fn` dentro del esquema de la cuenta cuando se inspecciona otra cuenta. */
export type RunScoped = <T>(fn: () => Promise<T>) => Promise<T>;

export interface OrdenesVentaPageData {
  rows: OrdenVentaOperadorRow[];
  idsConFotosCaptura: Set<string>;
  idsCorreoNoEnviado: Set<string>;
}

export type PrintRetryTarget = {
  idOrdenVenta: string;
  venta: string;
  idBodega: string | null;
  /** OT elegidas en el modal; al reintentar salen solo esas. Vacío = toda la OV. */
  ots?: readonly number[];
};

export type OvFeedback = {
  ok: boolean;
  title: string;
  lines: string[];
  retry: PrintRetryTarget | null;
  /** REQ-189: pestaña con versión vieja; el botón recarga la página. */
  recargar?: boolean;
};

export type BusyAction = {
  id: string;
  kind: "print" | "preview" | "fotos" | "borrar";
};

export type PdfPreviewState = {
  title: string;
  blob: Blob | null;
  error: string | null;
};

export type SeleccionOtState = {
  row: OrdenVentaOperadorRow;
  accion: AccionSobreOt;
  yaImpresa: boolean;
};

export type FotosPreviewState = {
  idOrdenVenta: string;
  title: string;
  ordenesTrabajo: OrdenVentaOtConFotosItem[];
  selectedOt: string | null;
  fotos: OrdenVentaFotoCapturaItem[];
  loadingOts: boolean;
  loadingFotos: boolean;
  /** true = abierto desde Cypher para una OT; no volver al listado de OTs. */
  lockToOt: boolean;
  error: string | null;
};

export type ConteoPorEstado = Record<EstadoOrdenVenta, number>;

/**
 * Pestaña abierta antes de un despliegue: no es un fallo de impresión ni se reintenta,
 * solo hay que recargar. La app responde `no-store` (incluido /_next/*) y no usa service
 * worker, así que una recarga normal descarga todo de nuevo, igual que Ctrl+Shift+R.
 */
export const FEEDBACK_VERSION_NUEVA: OvFeedback = {
  ok: false,
  title: MENSAJE_VERSION_NUEVA,
  lines: [],
  retry: null,
  recargar: true,
};
