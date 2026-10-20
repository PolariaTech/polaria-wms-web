export type {
  CreateOrdenVentaInput,
  EstadoOrdenVenta,
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
  OrdenVentaOperadorRow,
  OrdenVentaRow,
  ProductoVentaOption,
  UpdateOrdenVentaInput,
} from "./shared/types/sales.types";

export {
  CATALOGO_VENTA_EMPTY_MESSAGE,
  ESTADO_ORDEN_VENTA_LABELS,
  ESTADOS_ORDEN_VENTA,
  formatEstadoOrdenVenta,
  normalizeEstadoOrdenVenta,
  puedeBorrarOrdenVenta,
  puedeEditarOrdenVenta,
  variantEstadoOrdenVenta,
} from "./shared/constants/sales-status";

export {
  borrarOrdenVenta,
  countOrdenesVentaPorConfirmar,
  createOrdenVenta,
  getOrdenVentaDetalle,
  listOrdenesVenta,
  listOrdenesVentaOperador,
  listOrdenesVentaOperadorParaJefe,
  listProductosVentaCatalogo,
  updateOrdenVenta,
} from "./shared/services/sales.service";

export {
  emitirOrdenVentaApi,
  listOrdenesVentaApi,
  listOrdenesVentaParaSalida,
} from "./shared/services/sales-api.service";

export { OperadorOrdenesVentaPageContent } from "./ordenes/components/pages/OperadorOrdenesVentaPageContent";
export { OrdenVentaCreateModal } from "./ordenes/components/modals/OrdenVentaCreateModal";
export { OrdenVentaDetalleModal } from "./ordenes/components/modals/OrdenVentaDetalleModal";
export { VentasOperadorHub } from "./operador/components/VentasOperadorHub";
export { VentasPageContent } from "./ordenes/components/pages/VentasPageContent";
