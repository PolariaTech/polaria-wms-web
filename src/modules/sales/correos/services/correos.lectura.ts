import type {
  ConfianzaCorreo,
  CorreoFila,
  ResultadoFlujoCorreo,
} from "../types/correos.types";

/** REQ-275: lectura de lo que el flujo anotó de cada correo (columnas nuevas del data table). */

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
  "resultado" | "confianza" | "tipo" | "codigoOrdenVenta"
>;

export function leerCamposDelFlujo(valor: Record<string, unknown>): CamposDelFlujo {
  return {
    resultado: enumONulo(valor.resultado, RESULTADOS),
    confianza: enumONulo(valor.confianza, CONFIANZAS),
    tipo: textoONulo(valor.tipo),
    codigoOrdenVenta: textoONulo(valor.codigoOrdenVenta),
  };
}
