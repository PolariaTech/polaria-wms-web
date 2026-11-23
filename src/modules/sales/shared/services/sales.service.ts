/**
 * Barrel de servicios de ventas. La implementación vive en módulos cohesivos
 * `sales-*.ts`; este archivo conserva la API pública histórica.
 */
export { fetchUltimaDireccionEntregaPorComprador } from "./sales-ultima-direccion-entrega";
export { fetchUltimosPreciosPorComprador } from "./sales-precios-venta";
export {
  countOrdenesVentaPorConfirmar,
  listOrdenesVenta,
  getOrdenVentaOperadorById,
  listOrdenesVentaOperador,
  listOrdenesVentaOperadorParaJefe,
} from "./sales-operador-listado.service";
export {
  getCuentaIdBodegaDefault,
  listProductosVentaCatalogo,
  type ListProductosVentaCatalogoParams,
} from "./sales-catalogo-venta.service";
export {
  createOrdenVenta,
  updateOrdenVenta,
} from "./sales-create-orden-venta.service";
export {
  avanzarEstadoOrdenVenta,
  borrarOrdenVenta,
} from "./sales-orden-venta-estado.service";
export {
  getOrdenVentaDetalle,
  type GetOrdenVentaDetalleParams,
} from "./sales-orden-venta-detalle.service";
