/**
 * Cliente de los endpoints de REQ-187 (`/ventas/ordenes/:id/ordenes-trabajo/…`):
 *
 * - `interpretar-instruccion`: decide qué función corresponde a lo que escribió el
 *   usuario (mover renglones que ya existen o releer el correo y los archivos).
 * - `propuesta-correccion-correo`: releer el correo y los archivos. Tarda de decenas de
 *   segundos a minutos, y el proxy de la web corta a los 30 s, así que NO es una sola
 *   petición: el POST responde 202 con un `jobId` y aquí se consulta el avance.
 *
 * Solo piden PROPUESTAS: nada se escribe. Quien llama cancela con un `AbortSignal`.
 */

export type {
  CodigoErrorCorreccionCorreo,
  ExpectativasUsuarioApi,
  IntencionChatOt,
  InterpretacionInstruccionApi,
} from "./correccion-correo.client.types";
export { CorreccionCorreoApiError } from "./correccion-correo.client.types";
export { interpretarInstruccion } from "./correccion-correo.client.interpretar";
export {
  ESPERA_MAXIMA_MS,
  INTERVALO_CONSULTA_MS,
  solicitarCorreccionCorreo,
} from "./correccion-correo.client.solicitar";