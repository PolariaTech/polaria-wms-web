import type {
  ConfianzaCorreo,
  CorreoFila,
  ResultadoFlujoCorreo,
} from "../types/correos.types";

/** Lectura de lo que el flujo anotó de cada correo en el data table de n8n (REQ-104 y REQ-275). */

const RESULTADOS: readonly ResultadoFlujoCorreo[] = [
  "recibido",
  "ingresado",
  "duplicado",
  "error",
  "no_es_pedido",
];

const CONFIANZAS: readonly ConfianzaCorreo[] = ["alta", "media", "baja"];

const textoONulo = (valor: unknown): string | null =>
  typeof valor === "string" ? valor : null;

/** Un valor que no está en la lista (el api agregó uno nuevo) se trata como si no viniera. */
const enumONulo = <T extends string>(valor: unknown, validos: readonly T[]): T | null =>
  validos.includes(valor as T) ? (valor as T) : null;

export type CamposDelFlujo = Pick<
  CorreoFila,
  | "nuevoPedido"
  | "motivo"
  | "resultado"
  | "confianza"
  | "tipo"
  | "codigoOrdenVenta"
  | "idRegistro"
  | "registradoEn"
  | "actualizadoEn"
>;

export function leerCamposDelFlujo(valor: Record<string, unknown>): CamposDelFlujo {
  return {
    nuevoPedido: typeof valor.nuevoPedido === "boolean" ? valor.nuevoPedido : null,
    motivo: textoONulo(valor.motivo),
    idRegistro: textoONulo(valor.idRegistro),
    registradoEn: textoONulo(valor.registradoEn),
    actualizadoEn: textoONulo(valor.actualizadoEn),
    resultado: enumONulo(valor.resultado, RESULTADOS),
    confianza: enumONulo(valor.confianza, CONFIANZAS),
    tipo: textoONulo(valor.tipo),
    codigoOrdenVenta: textoONulo(valor.codigoOrdenVenta),
  };
}
