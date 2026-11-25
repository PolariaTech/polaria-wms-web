export * from "./texto-origen-pedido-correo";
export * from "./texto-origen-pedido-contenido";
export {
  looksLikeCorreoCuerpoEnNotas,
  looksLikeEmailHeaderJunk,
  sanitizeNotasGeneralesPedido,
  stripCamposParametrizadosDeNotas,
} from "./sanitize-notas-generales-pedido";