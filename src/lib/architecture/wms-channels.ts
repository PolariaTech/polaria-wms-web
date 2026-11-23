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
   * Sync automático por fotos QR de surtido: BFF Next + service_role
   * (no JWT authenticated; ver orden-surtido-sync-estado).
   */
  avanceEstadoSurtidoQr: WMS_CHANNEL.NEXT_BFF,
  correosYOt: WMS_CHANNEL.NEST,
  leerPedidoIa: WMS_CHANNEL.NEXT_BFF,
  imprimirAdjuntosLog: WMS_CHANNEL.NEXT_BFF,
} as const;

/** Procesamiento: listados scoped y mutaciones solo Nest (sin fallback silencioso). */
export const PROCESSING_CHANNEL_CONTRACT = {
  listadosScoped: WMS_CHANNEL.NEST,
  listadosLegacySinScope: WMS_CHANNEL.SUPABASE,
  crearYMutar: WMS_CHANNEL.NEST,
} as const;
