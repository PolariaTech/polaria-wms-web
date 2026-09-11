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
  formatEstadoOrdenVenta,
  puedeEditarOrdenVenta,
} from "./shared/constants/sales-status";

export {
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

export { OperadorOrdenesVentaPageContent } from "./ordenes/components/OperadorOrdenesVentaPageContent";
export { OrdenVentaCreateModal } from "./ordenes/components/OrdenVentaCreateModal";
export { OrdenVentaDetalleModal } from "./ordenes/components/OrdenVentaDetalleModal";
export { VentasOperadorHub } from "./operador/components/VentasOperadorHub";
export { VentasPageContent } from "./ordenes/components/VentasPageContent";
