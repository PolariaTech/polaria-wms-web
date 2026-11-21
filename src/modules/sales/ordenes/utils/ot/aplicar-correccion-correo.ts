import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";

/**
 * Corrección de OT contra el correo (REQ-187) — lado cliente.
 *
 * El api relee los archivos originales de la OV (correo y PDF) con el mismo núcleo que
 * `leer-pedido` y devuelve una PROPUESTA: las OT que debería tener la OV según los
 * documentos, ya verificadas contra el «Total pedido» de cada uno. Aquí solo se describe
 * esa propuesta; aplicarla al formulario reutiliza el flujo de «abrir una OV externa»
 * (renglones → líneas con producto de catálogo) y se guarda con el guardado normal.
 */

export interface VerificacionDocumentoApi {
  totalDocumento: number | null;
  importe: number;
  diferencia: number | null;
  /** true/false si el documento declara total; null si no se pudo verificar. */
  cuadra: boolean | null;
}

export interface DocumentoCorreccionApi {
  nombre: string;
  oc: string | null;
  ocFuente: "contenido" | "nombre" | "ambas" | null;
  renglones: number;
  verificacion: VerificacionDocumentoApi;
  relecturaPorBloques: boolean;
}

export interface OtCorreccionApi {
  id: string;
  etiqueta: string;
  numeroPedido: string;
  almacen: string;
  totalCantidad: number;
  renglones: OrigenCorreoRenglon[];
}

export interface ResumenCorreccionApi {
  otAntes: number;
  otDespues: number;
  renglonesAntes: number;
  renglonesDespues: number;
  importeAntes: number;
  importeDespues: number;
}

export interface DiffCorreccionApi {
  otNuevas: string[];
  otEliminadas: string[];
  renglonesAgregados: number;
  renglonesQuitados: number;
}

export interface AdvertenciaCorreccionApi {
  codigo: string;
  documento?: string;
  detalle: string;
}

/** Lo que el usuario dijo esperar frente a lo que dicen los documentos. */
export interface ExpectativasResultadoApi {
  totalOtPedido: number | null;
  importeTotalPedido: number | null;
  totalOtResultado: number;
  importeResultado: number;
  /** null si el usuario no lo dijo. */
  coincideTotalOt: boolean | null;
  coincideImporte: boolean | null;
}

export interface PropuestaCorreccionCorreoApi {
  requestId: string;
  propuestaId: string;
  baseHash: string;
  documentos: DocumentoCorreccionApi[];
  ots: OtCorreccionApi[];
  resumen: ResumenCorreccionApi;
  diff: DiffCorreccionApi;
  advertencias: AdvertenciaCorreccionApi[];
  /** Solo si el usuario dijo cuántas OT o qué total esperaba. */
  expectativas?: ExpectativasResultadoApi;
}

/** Renglones de la propuesta, en el orden de sus OT, en el formato de `origen_correo`. */
export function origenCorreoDePropuesta(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "ots">,
): OrigenCorreoRenglon[] {
  return propuesta.ots.flatMap((ot) => ot.renglones.map((renglon) => ({ ...renglon })));
}

function hayCambiosEstructurales(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "diff">,
): boolean {
  return (
    propuesta.diff.otNuevas.length > 0 ||
    propuesta.diff.otEliminadas.length > 0 ||
    propuesta.diff.renglonesAgregados > 0 ||
    propuesta.diff.renglonesQuitados > 0
  );
}

/** Documentos cuyo «Total pedido» no cuadra con la suma leída. */
export function documentosConTotalQueNoCuadra(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "documentos">,
): DocumentoCorreccionApi[] {
  return propuesta.documentos.filter((d) => d.verificacion.cuadra === false);
}

/**
 * Hay OT y cambios estructurales que aplicar.
 * REQ-372: un total que no cuadra ya no bloquea (el panel avisa; el usuario decide).
 */
export function puedeAplicarCorreccion(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "ots" | "documentos" | "diff">,
): boolean {
  if (propuesta.ots.length === 0) return false;
  return hayCambiosEstructurales(propuesta);
}

/** Documentos cuyo total no se pudo verificar (el documento no declara «Total pedido»). */
export function documentosSinVerificar(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "documentos">,
): DocumentoCorreccionApi[] {
  return propuesta.documentos.filter((d) => d.verificacion.cuadra === null);
}

/**
 * Mensaje de estado bajo el resumen: null = usar el texto por defecto de «aplicar».
 * REQ-372: no decir «ya coincide» cuando el total no cuadra o el importe esperado falla.
 */
export function mensajeEstadoCorreccion(
  propuesta: Pick<
    PropuestaCorreccionCorreoApi,
    "ots" | "documentos" | "diff" | "expectativas" | "resumen"
  >,
): { tono: "aviso" | "bloqueo" | "ok"; texto: string } | null {
  const noCuadran = documentosConTotalQueNoCuadra(propuesta);
  const puede = puedeAplicarCorreccion(propuesta);

  if (puede && noCuadran.length > 0) {
    return {
      tono: "aviso",
      texto:
        "La suma de la relectura no cuadra con el «Total pedido» del documento. Puedes aplicar igual (mejor esfuerzo) o corregir a mano.",
    };
  }
  if (puede) return null;

  if (noCuadran.length > 0) {
    return {
      tono: "bloqueo",
      texto:
        "La relectura no cuadra con el total del documento y no hay cambios respecto a lo guardado. Intenta releer de nuevo o corrige a mano.",
    };
  }
  if (propuesta.expectativas?.coincideImporte === false) {
    const pedido = propuesta.expectativas.importeTotalPedido;
    const resultado = propuesta.expectativas.importeResultado;
    return {
      tono: "bloqueo",
      texto: `El importe aún no coincide con el total esperado (${formatearImporte(resultado)} leído vs ${formatearImporte(pedido ?? 0)} pedido). No hay cambios estructurales que aplicar.`,
    };
  }
  return {
    tono: "bloqueo",
    texto: "La orden ya coincide con los documentos: no hay nada que corregir.",
  };
}

const MAX_DOCUMENTOS_BITACORA = 10;

/** Mensaje y datos de bitácora de una corrección guardada. Solo metadatos, nunca los renglones. */
export function describirCorreccionParaBitacora(params: {
  autor: string;
  resumen: ResumenCorreccionApi;
  documentos: readonly DocumentoCorreccionApi[];
}): { mensaje: string; payloadExtra: Record<string, unknown> } {
  const { resumen } = params;
  return {
    mensaje: `Órdenes de trabajo corregidas contra el correo por ${params.autor}: ${resumen.otAntes} → ${resumen.otDespues} OT, ${resumen.renglonesAntes} → ${resumen.renglonesDespues} productos.`,
    payloadExtra: {
      correccionCorreoIa: {
        resumen,
        documentos: params.documentos.slice(0, MAX_DOCUMENTOS_BITACORA).map((documento) => ({
          nombre: documento.nombre,
          oc: documento.oc,
          renglones: documento.renglones,
          totalDocumento: documento.verificacion.totalDocumento,
          importe: documento.verificacion.importe,
          cuadra: documento.verificacion.cuadra,
        })),
      },
    },
  };
}

/** Pesos con dos decimales y separadores es-MX. */
export function formatearImporte(valor: number): string {
  return valor.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** «1 producto» / «2 productos». */
export function etiquetaRenglones(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? "producto" : "productos"}`;
}

/** `correo.eml → PEDIDO.pdf` → `PEDIDO.pdf`. */
export function nombreDeArchivo(documento: string): string {
  const partes = documento.split(" → ");
  return partes[partes.length - 1] ?? documento;
}

export function etiquetaVerificacion(documento: DocumentoCorreccionApi): string {
  const { cuadra, totalDocumento, importe } = documento.verificacion;
  if (cuadra === true) {
    return `Cuadra con el total del documento (${formatearImporte(importe)})`;
  }
  if (cuadra === false) {
    return `No cuadra: lo leído suma ${formatearImporte(importe)} y el documento dice ${formatearImporte(totalDocumento ?? 0)}`;
  }
  return "El documento no declara total: no se pudo verificar";
}

/** Cuánto suele tardar cada etapa, medido con los pedidos reales (OV-940 y OV-943). */
export interface RangoEspera {
  minSeg: number;
  maxSeg: number;
}

/** Interpretar la instrucción: 1,5 a 5,4 s medidos. */
export const ESPERA_INTERPRETAR: RangoEspera = { minSeg: 2, maxSeg: 10 };
/** Reorganizar renglones que ya existen: ~6 s medidos con la OV-940. */
export const ESPERA_REORGANIZAR: RangoEspera = { minSeg: 5, maxSeg: 30 };
/** Releer correo y archivos: 51 a 142 s medidos con bloques en paralelo. */
export const ESPERA_RELEER: RangoEspera = { minSeg: 60, maxSeg: 180 };

function formatearSegundos(segundos: number): { cifra: number; base: "segundo" | "minuto" } {
  if (segundos < 60) return { cifra: segundos, base: "segundo" };
  return { cifra: Math.round(segundos / 60), base: "minuto" };
}

function conUnidad(cifra: number, base: "segundo" | "minuto"): string {
  return `${cifra} ${base}${cifra === 1 ? "" : "s"}`;
}

/**
 * Espera en segundos: «unos segundos» (REQ-283: no prometer rangos que no se cumplen).
 * Espera en minutos: sigue el rango medido («entre 1 y 3 minutos»).
 */
export function describirEspera(rango: RangoEspera): string {
  const desde = formatearSegundos(rango.minSeg);
  const hasta = formatearSegundos(rango.maxSeg);
  if (desde.base === "segundo" && hasta.base === "segundo") {
    return "Este proceso puede tardar unos segundos.";
  }
  const primera =
    desde.base === hasta.base ? `${desde.cifra}` : conUnidad(desde.cifra, desde.base);
  return `Este proceso puede tardar entre ${primera} y ${conUnidad(hasta.cifra, hasta.base)}.`;
}
