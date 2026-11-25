/**
 * Canales de comunicación WMS (contrato operativo).
 * Detalle: docs/ARQUITECTURA-COMUNICACION.md
 *
 * A = Supabase+RLS · B = Nest · C = mateo-ia-api · D = BFF Next
 * No mover flujos entre canales sin ticket + tests.
 */
export const WMS_CHANNEL = {
  SUPABASE: "A",
  NEST: "B",
  MATEO_IA: "C",
  NEXT_BFF: "D",
} as const;

export type WmsChannel = (typeof WMS_CHANNEL)[keyof typeof WMS_CHANNEL];

/** Flujos OV críticos y su canal obligatorio (no cambiar sin migración acordada). */
export const OV_CHANNEL_CONTRACT = {
  listadoYBorrador: WMS_CHANNEL.SUPABASE,
  emitirYCancelar: WMS_CHANNEL.NEST,
  /** Avance post-emit manual (Cypher): Nest, no JWT authenticated. */
  avanceEstadoPostEmit: WMS_CHANNEL.NEST,
  /**
   * Sync automático por fotos QR: BFF calcula el hito y Nest escribe el estado
   * (INTERNAL_API_KEY; ver orden-surtido-sync-estado).
   */
  avanceEstadoSurtidoQr: WMS_CHANNEL.NEST,
  /** Confirmación pública de despacho: BFF lee el listado; Nest escribe el estado. */
  despachoPublico: WMS_CHANNEL.NEST,
  correosYOt: WMS_CHANNEL.NEST,
  leerPedidoIa: WMS_CHANNEL.NEXT_BFF,
  imprimirAdjuntosLog: WMS_CHANNEL.NEXT_BFF,
} as const;

/** Procesamiento: listados y mutaciones solo Nest (sin listado legacy sin scope). */
export const PROCESSING_CHANNEL_CONTRACT = {
  listadosScoped: WMS_CHANNEL.NEST,
  crearYMutar: WMS_CHANNEL.NEST,
} as const;
