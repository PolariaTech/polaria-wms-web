export type CypherCompanionOtHija = {
  id: string;
  label: string;
  productosCount: number;
  totalCantidad: number;
  almacen: string;
};

export type CypherCompanionOtPicker = {
  hijas: CypherCompanionOtHija[];
  /** OT activa en el panel izquierdo (resaltada). */
  selectedId?: string | null;
  onSelect: (id: string) => void;
  /**
   * Abre el modal «Modificar con IA» (REQ-125). Solo lo entrega el formulario de
   * edición cuando la OV está por confirmar; sin él, el botón no se dibuja.
   */
  onReagrupar?: () => void;
};
