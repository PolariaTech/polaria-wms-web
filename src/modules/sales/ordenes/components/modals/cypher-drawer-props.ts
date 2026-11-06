import type { CypherCompanionOtPicker } from "./cypher-companion-ot.types";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";

export type { CypherCompanionOtPicker, CypherCompanionOtHija } from "./cypher-companion-ot.types";

export interface OrdenVentaCypherDrawerProps {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  row: OrdenVentaOperadorRow | null;
  inspect?: boolean;
  busyKind: "print" | "preview" | "fotos" | "borrar" | null;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onPreview: () => void;
  /** Fotos de la OT seleccionada en Cypher (no de toda la OV). */
  onFotos: (idOrdenTrabajo: string) => void;
  /** Soft-delete (UI «Borrar»); solo por confirmar. */
  onBorrar?: () => void | Promise<void>;
  /**
   * Abierto junto al modal de edición o detalle: Cypher a la derecha, sin tapar el panel.
   */
  companionWithEdit?: boolean;
  /**
   * OV por confirmar + Cypher compañero: selector de OT en el panel derecho.
   */
  companionOtPicker?: CypherCompanionOtPicker | null;
  /** REQ-126: cliente vivo del formulario de edición (prioridad sobre detalle). */
  companionIdComprador?: string | null;
  /** Recarga la lista después de un avance manual de estado. */
  onEstadoCambiado?: () => void;
  /**
   * REQ-188: Cypher abierto solo desde el «+» de Acciones (sin formulario). Abre la
   * edición de la OV con el chat «Modificar con IA» ya listo. Solo se entrega con la
   * OV por confirmar.
   */
  onReagruparDesdeLista?: () => void;
}
