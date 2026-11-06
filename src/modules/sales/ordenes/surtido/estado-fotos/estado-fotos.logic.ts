import { todayIsoDateBogota } from "@/modules/warehouses/bodega-reportes/utils/bodega-reportes-fecha";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "../../utils/origen/origen-correo-ordenes-trabajo";

/**
 * POL-406: reglas de la pantalla «Estado de fotos». Todo es puro (sin red) para probarlo
 * sin base de datos. Los días son calendario de Colombia (UTC-5, sin horario de verano).
 */

export type EstadoFoto = "recibida" | "procesando" | "lista" | "fallo";
export type RangoFotos = "hoy" | "ayer" | "7dias" | "30dias";

export const RANGO_POR_DEFECTO: RangoFotos = "hoy";

/** Mismo plazo que usa la captura: pasado esto, un intento en curso se da por perdido. */
export const FOTO_COLGADA_MS = 120_000;

/** Filas que muestra la tabla (las más recientes del rango). */
export const MAX_FILAS_FOTOS = 50;

export const RANGOS_FOTOS: readonly { id: RangoFotos; etiqueta: string }[] = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "ayer", etiqueta: "Ayer" },
  { id: "7dias", etiqueta: "Últimos 7 días" },
  { id: "30dias", etiqueta: "Últimos 30 días" },
];

export const ESTADOS_FOTO: readonly EstadoFoto[] = [
  "recibida",
  "procesando",
  "lista",
  "fallo",
];

const DIA_MS = 86_400_000;
/** Medianoche de Colombia en UTC. */
const DESFASE_COLOMBIA = "T05:00:00.000Z";

/** Límites del rango como ISO UTC: `desde` incluido, `hasta` excluido. */
export function limitesDeRango(
  rango: RangoFotos,
  ahora: Date = new Date(),
): { desde: string; hasta: string } {
  const inicioHoy = Date.parse(`${todayIsoDateBogota(ahora)}${DESFASE_COLOMBIA}`);
  const [desde, hasta] =
    rango === "ayer"
      ? [inicioHoy - DIA_MS, inicioHoy]
      : rango === "7dias"
        ? [inicioHoy - 6 * DIA_MS, inicioHoy + DIA_MS]
        : rango === "30dias"
          ? [inicioHoy - 29 * DIA_MS, inicioHoy + DIA_MS]
          : [inicioHoy, inicioHoy + DIA_MS];
  return { desde: new Date(desde).toISOString(), hasta: new Date(hasta).toISOString() };
}

/** Sigue en curso y ya pasó el plazo: la función murió sin avisar. */
export function estaColgada(
  fila: { estado: EstadoFoto; created_at: string },
  ahora: Date = new Date(),
): boolean {
  if (fila.estado !== "recibida" && fila.estado !== "procesando") return false;
  return ahora.getTime() - new Date(fila.created_at).getTime() > FOTO_COLGADA_MS;
}

export interface ResumenFotos {
  recibida: number;
  procesando: number;
  lista: number;
  fallo: number;
  /** Subconjunto de recibida y procesando que ya pasó el plazo. */
  colgadas: number;
  total: number;
}

export function resumirFotos(
  filas: readonly { estado: EstadoFoto; created_at: string }[],
  ahora: Date = new Date(),
): ResumenFotos {
  const resumen: ResumenFotos = {
    recibida: 0,
    procesando: 0,
    lista: 0,
    fallo: 0,
    colgadas: 0,
    total: filas.length,
  };
  for (const fila of filas) {
    resumen[fila.estado] += 1;
    if (estaColgada(fila, ahora)) resumen.colgadas += 1;
  }
  return resumen;
}

/**
 * Códigos de fallo cuyo mensaje es una frase fija escrita para el operador. Cualquier otro (en
 * especial `error_proceso`, que puede traer el texto crudo de una excepción) no se muestra tal cual.
 */
const CODIGOS_CON_MENSAJE_CLARO: ReadonlySet<string> = new Set([
  "no_hoja",
  "foto_mala",
  "precision_baja",
  "imagen_ilegible",
  "orden_no_encontrada",
  "sin_respuesta",
]);

export const MENSAJE_FOTO_GENERICO =
  "No se pudo procesar la foto. Tómala de nuevo y, si se repite, avisa a soporte.";

/** El mensaje que ve el operador: el guardado si es de un código conocido; si no, uno genérico. */
export function mensajeParaOperador(codigo: string | null, mensaje: string | null): string {
  const texto = mensaje?.trim();
  return codigo && CODIGOS_CON_MENSAJE_CLARO.has(codigo) && texto ? texto : MENSAJE_FOTO_GENERICO;
}

export interface PartesOt {
  pedido: string | null;
  almacen: string | null;
}

const PALABRAS_MENORES = new Set(["de", "del", "la", "las", "el", "los", "y", "en"]);

function aTitulo(texto: string): string {
  return texto
    .split(/\s+/)
    .map((palabra, indice) =>
      indice > 0 && PALABRAS_MENORES.has(palabra)
        ? palabra
        : palabra.charAt(0).toUpperCase() + palabra.slice(1),
    )
    .join(" ");
}

/**
 * La clave de una OT hija es `pedido:<número>|almacen:<nombre>`, en minúsculas y con «_» cuando
 * falta una parte. Vacía significa captura de toda la OV (null). Una clave con otro formato se
 * muestra tal cual como almacén.
 */
export function partesDeOt(clave: string): PartesOt | null {
  const limpia = clave.trim();
  if (!limpia) return null;
  const partes = /^pedido:([\s\S]*)\|almacen:([\s\S]*)$/.exec(limpia);
  if (!partes) return { pedido: null, almacen: aTitulo(limpia) };
  const valor = (texto: string): string | null => {
    const textoLimpio = texto.trim();
    return textoLimpio === "" || textoLimpio === "_" ? null : textoLimpio;
  };
  const almacen = valor(partes[2]);
  return { pedido: valor(partes[1]), almacen: almacen ? aTitulo(almacen) : null };
}

export interface DatosOt {
  /** Posición de la OT dentro de su OV: el «1» de «1/9», el mismo número de la hoja impresa. */
  numero: number;
  total: number;
  /** Nombre del almacén como viene en el pedido (con sus mayúsculas y siglas). */
  almacen: string;
  pedido: string;
  /** Las OT de la OV son de más de un pedido: solo entonces el pedido ayuda a distinguirlas. */
  pedidoVaria: boolean;
}

/**
 * La clave de una OT para compararla, sin tildes, mayúsculas ni espacios de más. El mismo almacén
 * llega escrito de varias formas («Producción» y «produccion»): la clave que guardó la foto puede no
 * coincidir letra por letra con la de la OV, y sin esto esa foto quedaría sin su posición.
 */
export function claveComparable(clave: string): string {
  return clave
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Las OT de una OV por su clave comparable (ver `claveComparable`; la clave que guarda cada intento
 * en `id_orden_trabajo` se busca con ella). Usa el mismo agrupado y orden que la hoja impresa, así
 * «1/9» aquí es «1/9» en el papel.
 */
export function otsDeOrigen(origenCorreo: unknown): Map<string, DatosOt> {
  const hijas = groupOrigenCorreoToOrdenesTrabajo(parseOrigenCorreoJson(origenCorreo));
  const pedidoVaria =
    new Set(hijas.map((hija) => hija.numeroPedido.trim()).filter(Boolean)).size > 1;
  return new Map(
    hijas.map((hija, indice) => [
      claveComparable(hija.id),
      {
        numero: indice + 1,
        total: hijas.length,
        almacen: hija.almacen,
        pedido: hija.numeroPedido,
        pedidoVaria,
      },
    ]),
  );
}

/** Milisegundos totales que guardó la captura en `tiempos.total`, o null si no hay. */
export function tiempoTotalMs(tiempos: unknown): number | null {
  if (!tiempos || typeof tiempos !== "object") return null;
  const total = (tiempos as Record<string, unknown>).total;
  return typeof total === "number" && Number.isFinite(total) ? total : null;
}

/** 4 200 ms → «4,2 s»; menos de un segundo → «850 ms». */
export function formatearDuracion(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} s`;
}
