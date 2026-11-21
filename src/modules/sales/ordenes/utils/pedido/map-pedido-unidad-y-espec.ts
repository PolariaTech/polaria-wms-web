import { resolveEspecificacionPedidoLinea } from "./resolve-especificacion-pedido-linea";
import {
  fraseUnidadPedidoDiscrepante,
  unidadLineaPedidoForm,
} from "./resolve-unidad-pedido-linea";

/** REQ-380: unidad de catálogo + especificación con discrepancia del pedido. */
export function unidadYEspecificacionLineaForm(params: {
  textoOriginal: string;
  especificacionIa: string | null | undefined;
  especificacionEnvase: string;
  unidadOrigen?: string | null;
  unidadCatalogo: string;
}): { unidadMedida: string; especificacion: string } {
  const unidadMedida = unidadLineaPedidoForm(
    params.textoOriginal,
    params.unidadCatalogo,
    params.unidadOrigen,
    params.especificacionIa,
  );
  const especificacion = resolveEspecificacionPedidoLinea({
    especificacionIa: params.especificacionIa,
    envaseTexto: params.especificacionEnvase,
    textoOriginal: params.textoOriginal,
    unidadPedidoDiscrepante: fraseUnidadPedidoDiscrepante({
      unidadOrigen: params.unidadOrigen,
      unidadCatalogo: params.unidadCatalogo,
      textoProducto: params.textoOriginal,
      textoExtra: params.especificacionIa,
    }),
  });
  return { unidadMedida, especificacion };
}
