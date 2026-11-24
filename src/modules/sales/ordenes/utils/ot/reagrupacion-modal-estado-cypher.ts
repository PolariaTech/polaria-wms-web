import { normalizeEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import type { CypherCompanionOtPicker } from "../../components/modals/OrdenVentaCypherDrawer";
import { puedeReagruparOt } from "./reagrupar-ordenes-trabajo";

/**
 * El chat de reorganizar solo vive mientras el Cypher esté abierto: al cerrar el panel
 * que tiene el botón, el chat se cierra con él.
 */
export function reagruparModalAbierto(estado: {
  reagruparOpen: boolean;
  cypherOpen: boolean;
  isEditing: boolean;
  tieneOrdenVenta: boolean;
}): boolean {
  return (
    estado.reagruparOpen &&
    estado.cypherOpen &&
    estado.isEditing &&
    estado.tieneOrdenVenta
  );
}

/**
 * REQ-188: «Modificar con IA» desde el «+» de Acciones. Solo con el Cypher abierto solo
 * (sin formulario ni detalle: ahí el botón lo publica el propio formulario) y la OV por
 * confirmar.
 */
export function puedeModificarConIaDesdeLista(estado: {
  inspect: boolean;
  cypherId: string | null;
  formularioAbierto: boolean;
  detalleAbierto: boolean;
  estadoOrdenVenta: string | null | undefined;
}): boolean {
  return (
    !estado.inspect &&
    Boolean(estado.cypherId) &&
    !estado.formularioAbierto &&
    !estado.detalleAbierto &&
    Boolean(estado.estadoOrdenVenta?.trim()) &&
    normalizeEstadoOrdenVenta(estado.estadoOrdenVenta) === "por_confirmar"
  );
}

/**
 * REQ-188: selector de OT del Cypher cuando está solo (sin formulario). Lleva el botón
 * «Modificar con IA» si la página lo entrega; sin OT no hay selector.
 */
export function armarPickerOtRespaldo(datos: {
  hijas: ReadonlyArray<{
    id: string;
    label: string;
    renglones: readonly unknown[];
    totalCantidad: number;
    almacen: string;
  }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReagrupar?: () => void;
}): CypherCompanionOtPicker | null {
  if (datos.hijas.length === 0) return null;
  return {
    hijas: datos.hijas.map((hija) => ({
      id: hija.id,
      label: hija.label,
      productosCount: hija.renglones.length,
      totalCantidad: hija.totalCantidad,
      almacen: hija.almacen,
    })),
    selectedId: datos.selectedId ?? datos.hijas[0]?.id ?? null,
    onSelect: datos.onSelect,
    onReagrupar: datos.onReagrupar,
  };
}

/**
 * REQ-188: qué hacer con la apertura pedida desde el «+» de Acciones cuando el
 * formulario de edición ya está abierto.
 * - `esperar`: aún no cargan el estado de la OV o sus OT.
 * - `abrir`: abrir el chat y dar la petición por atendida.
 * - `descartar`: la OV ya no admite el cambio; dar la petición por atendida sin abrir.
 */
export function decidirAperturaReagruparAlCargar(estado: {
  pedida: boolean;
  formularioAbierto: boolean;
  editando: boolean;
  /**
   * El detalle que hay en el formulario es el de la OV que se está abriendo. Al cerrar el
   * formulario NO se limpian su estado ni sus OT, así que al abrir otra OV el primer render
   * trae los de la anterior: sin esta comprobación se decidiría con datos ajenos (abriría el
   * chat y el reseteo del formulario lo cerraría al instante, o descartaría la petición).
   */
  ordenCargada: boolean;
  estadoOrdenVenta: string | null | undefined;
  cantidadOt: number;
}): "ninguna" | "esperar" | "abrir" | "descartar" {
  if (!estado.pedida || !estado.formularioAbierto || !estado.editando) {
    return "ninguna";
  }
  if (!estado.ordenCargada) return "esperar";
  if (!estado.estadoOrdenVenta || estado.cantidadOt === 0) return "esperar";
  return puedeReagruparOt(estado.estadoOrdenVenta, estado.cantidadOt)
    ? "abrir"
    : "descartar";
}

/**
 * El chat de «Modificar con IA» vive con el Cypher: si éste se cierra (la X, o cerrar el
 * formulario), el chat se cierra con él. Sin esto, `reagruparOpen` quedaba en true con el
 * Cypher cerrado y, al volver a abrirlo, el modal reaparecía solo.
 */
export function reagruparAbiertoSegunCypher(
  reagruparOpen: boolean,
  cypherOpen: boolean,
): boolean {
  return cypherOpen && reagruparOpen;
}
