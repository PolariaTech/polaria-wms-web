export type CompradorPreciosPrintScope = {
  /** Grupos pertenecientes a incluir (todos sus compradores). */
  grupos: readonly string[];
  /**
   * Compradores adicionales por código.
   * No tienen que pertenecer a los grupos seleccionados.
   */
  codigosComprador: readonly string[];
};
