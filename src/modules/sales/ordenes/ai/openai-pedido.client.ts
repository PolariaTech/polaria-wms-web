/**
 * Tipos y fechas del pedido extraído.
 * La llamada OpenAI vive en mateo-ia-api; el BFF `/api/ventas/leer-pedido` la consume.
 */

export {
  type LineaExtraida,
  type PedidoExtraido,
  type ResultadoExtraccion,
  type UsoOpenAI,
  type ExtraerPedidoInput,
} from "./openai-pedido.tipos";

export {
  formatISO,
  normalizarFechaConocida,
  resolverFechaEntrega,
  sumarDias,
} from "./fechas-pedido";
