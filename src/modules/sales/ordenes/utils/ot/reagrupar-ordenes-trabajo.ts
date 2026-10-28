import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";
import { scoreMatch } from "./filter-lineas-by-orden-trabajo";

/**
 * Reagrupación de OT con IA (POL-391 / REQ-125) — lado cliente.
 *
 * El servidor (POL-390) solo PROPONE a qué OT va cada renglón. Aquí se arma lo que
 * se le manda, se vuelven a comprobar las invariantes y se aplica el plan MOVIENDO
 * los renglones Y reasignando el `otId` de las líneas del formulario en la misma
 * operación: al guardar, las líneas mandan sobre los renglones
 * (`buildOrigenCorreoFromOrdenesYLineas`), y si no se movieran, revertirían el cambio.
 */

const PATRON_OT_NUEVA = /^NUEVA-\d+$/;
const ETIQUETA_OT_NUEVA_POR_DEFECTO = "Nueva orden de trabajo";
const MAX_ETIQUETA_OT = 60;
const ESCALA_CANTIDAD = 1_000_000;

/** Línea del formulario con lo mínimo para emparejarla con un renglón. */
export interface LineaReagrupable {
  nombre: string;
  codigo: string;
  cantidadInput: string;
  otId?: string;
}

// ---------------------------------------------------------------------------
// Contrato con el endpoint (POL-390)
// ---------------------------------------------------------------------------

export interface RenglonEstadoBaseApi {
  renglonId: string;
  producto: string;
  cantidad: number | string;
  unidad?: string;
}

export interface OtEstadoBaseApi {
  otId: string;
  etiqueta: string;
  almacen: string;
  numeroPedido: string;
  renglones: RenglonEstadoBaseApi[];
}

export interface EstadoBaseApi {
  ots: OtEstadoBaseApi[];
}

export interface OtPropuestaApi {
  /** Id de una OT existente; null si es una OT nueva. */
  otId: string | null;
  /** `NUEVA-n` en las OT nuevas; null en las existentes. */
  nuevaClave: string | null;
  etiquetaSugerida: string | null;
  renglonIds: string[];
}

export interface ResumenReagrupacion {
  antes: number;
  despues: number;
  nuevas: number;
  vacias: number;
}

export interface MovimientoReagrupacion {
  renglonId: string;
  deOtId: string;
  /** Id de OT existente o clave `NUEVA-n`. */
  aOtId: string;
}

export interface PropuestaReagrupacionApi {
  propuestaId: string;
  baseHash: string;
  ots: OtPropuestaApi[];
  resumen: ResumenReagrupacion;
  movimientos: MovimientoReagrupacion[];
}

// ---------------------------------------------------------------------------
// Índice del estado base (congelado al armar la solicitud)
// ---------------------------------------------------------------------------

export interface RenglonIndexado {
  renglonId: string;
  otIdOrigen: string;
  renglon: OrigenCorreoRenglon;
  /** Posición de la línea del formulario emparejada; null si no hay. */
  lineaIndex: number | null;
}

export interface IndiceReagrupacion {
  porRenglonId: Map<string, RenglonIndexado>;
  /** Orden original de los renglones (para ordenar de forma estable). */
  orden: string[];
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function parseCantidadRenglon(valor: number | string | undefined): number {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string") {
    const numero = Number(valor.replace(",", ".").trim());
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

function aEscala(cantidad: number): number {
  return Math.round(cantidad * ESCALA_CANTIDAD);
}

function sanitizarEtiqueta(valor: string | null | undefined): string {
  const limpia = Array.from(valor ?? "", (caracter) => {
    const codigo = caracter.codePointAt(0) ?? 0;
    return codigo <= 0x1f || (codigo >= 0x7f && codigo <= 0x9f) ? " " : caracter;
  })
    .join("")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(limpia).slice(0, MAX_ETIQUETA_OT).join("");
}

/**
 * Empareja cada renglón con una línea del formulario, dentro de su misma OT.
 * Primero con las líneas de esa OT; lo que sobre, con líneas sin OT asignada.
 */
function emparejarLineas(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly LineaReagrupable[],
  parseCantidad: (raw: string) => number,
): Map<string, number> {
  const envueltas = lineas.map((linea, index) => ({
    index,
    otId: linea.otId,
    cantidad_pedida: parseCantidad(linea.cantidadInput),
    matchNombre: linea.nombre,
    matchCodigo: linea.codigo,
    producto: {
      sku: linea.codigo || null,
      descripcion: linea.nombre,
      metadatos_catalogo: null,
    },
  }));

  const usadas = new Set<number>();
  const lineaPorClave = new Map<string, number>();

  const emparejar = (
    claveRenglon: string,
    renglon: OrigenCorreoRenglon,
    candidatas: typeof envueltas,
  ) => {
    let mejorIndice = -1;
    let mejorPuntaje = -1;
    for (const candidata of candidatas) {
      if (usadas.has(candidata.index)) continue;
      const puntaje = scoreMatch(candidata, renglon);
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorIndice = candidata.index;
      }
    }
    if (mejorIndice >= 0) {
      usadas.add(mejorIndice);
      lineaPorClave.set(claveRenglon, mejorIndice);
    }
  };

  // Pasada 1: líneas que ya pertenecen a la OT del renglón.
  hijas.forEach((hija, indiceHija) => {
    const propias = envueltas.filter((linea) => linea.otId === hija.id);
    hija.renglones.forEach((renglon, indiceRenglon) => {
      emparejar(`${indiceHija}:${indiceRenglon}`, renglon, propias);
    });
  });

  // Pasada 2: renglones sin línea contra líneas que aún no tienen OT.
  const sinOt = envueltas.filter((linea) => !linea.otId);
  hijas.forEach((hija, indiceHija) => {
    hija.renglones.forEach((renglon, indiceRenglon) => {
      const clave = `${indiceHija}:${indiceRenglon}`;
      if (!lineaPorClave.has(clave)) emparejar(clave, renglon, sinOt);
    });
  });

  return lineaPorClave;
}

/**
 * Arma lo que se le manda al endpoint (solo OT y renglones, sin notas ni datos del
 * comprador) y el índice que permite aplicar después el plan sobre el estado real.
 */
export function construirEstadoBaseApi(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly LineaReagrupable[],
  parseCantidad: (raw: string) => number,
): { estadoBase: EstadoBaseApi; indice: IndiceReagrupacion } {
  const lineaPorClave = emparejarLineas(hijas, lineas, parseCantidad);
  const porRenglonId = new Map<string, RenglonIndexado>();
  const orden: string[] = [];

  const ots = hijas.map((hija, indiceHija) => ({
    otId: hija.id,
    etiqueta: hija.label,
    almacen: hija.almacen,
    numeroPedido: hija.numeroPedido,
    renglones: hija.renglones.map((renglon, indiceRenglon) => {
      const renglonId = `renglon-${indiceHija}-${indiceRenglon}`;
      porRenglonId.set(renglonId, {
        renglonId,
        otIdOrigen: hija.id,
        renglon,
        lineaIndex: lineaPorClave.get(`${indiceHija}:${indiceRenglon}`) ?? null,
      });
      orden.push(renglonId);
      const unidad = texto(renglon.Unidad);
      return {
        renglonId,
        producto: texto(renglon.Producto),
        cantidad: parseCantidadRenglon(renglon.Cantidad),
        ...(unidad ? { unidad } : {}),
      };
    }),
  }));

  return { estadoBase: { ots }, indice: { porRenglonId, orden } };
}

// ---------------------------------------------------------------------------
// Validación en cliente (R9) y aplicación
// ---------------------------------------------------------------------------

export type MotivoPropuestaInvalida =
  | "RENGLONES_NO_COINCIDEN"
  | "OT_INEXISTENTE"
  | "OT_DUPLICADA"
  | "TOTALES_NO_COINCIDEN";

export class PropuestaInvalidaError extends Error {
  constructor(readonly motivo: MotivoPropuestaInvalida) {
    super(`La propuesta no respeta las órdenes de trabajo originales (${motivo}).`);
    this.name = "PropuestaInvalidaError";
  }
}

/** Repite en el cliente las invariantes del servidor; lanza si alguna falla. */
export function validarPropuestaContraBase(
  propuesta: Pick<PropuestaReagrupacionApi, "ots">,
  hijas: readonly OrdenTrabajoHija[],
  indice: IndiceReagrupacion,
): void {
  const idsHijas = new Set(hijas.map((hija) => hija.id));
  const otsVistas = new Set<string>();
  const renglonesVistos = new Set<string>();

  for (const ot of propuesta.ots) {
    const clave = ot.otId ?? ot.nuevaClave;
    const esExistente = ot.otId !== null && idsHijas.has(ot.otId);
    const esNueva =
      ot.otId === null &&
      ot.nuevaClave !== null &&
      PATRON_OT_NUEVA.test(ot.nuevaClave);
    if (!esExistente && !esNueva) throw new PropuestaInvalidaError("OT_INEXISTENTE");
    if (clave === null || otsVistas.has(clave)) {
      throw new PropuestaInvalidaError("OT_DUPLICADA");
    }
    otsVistas.add(clave);

    for (const renglonId of ot.renglonIds) {
      if (!indice.porRenglonId.has(renglonId) || renglonesVistos.has(renglonId)) {
        throw new PropuestaInvalidaError("RENGLONES_NO_COINCIDEN");
      }
      renglonesVistos.add(renglonId);
    }
  }

  if (renglonesVistos.size !== indice.porRenglonId.size) {
    throw new PropuestaInvalidaError("RENGLONES_NO_COINCIDEN");
  }

  let totalBase = 0;
  for (const { renglon } of indice.porRenglonId.values()) {
    totalBase += aEscala(parseCantidadRenglon(renglon.Cantidad));
  }
  let totalFinal = 0;
  for (const ot of propuesta.ots) {
    for (const renglonId of ot.renglonIds) {
      totalFinal += aEscala(
        parseCantidadRenglon(indice.porRenglonId.get(renglonId)!.renglon.Cantidad),
      );
    }
  }
  if (totalBase !== totalFinal) throw new PropuestaInvalidaError("TOTALES_NO_COINCIDEN");
}

export interface MovimientoAplicado {
  producto: string;
  cantidad: number;
  /** Etiqueta de la OT de origen. */
  desde: string;
  /** Etiqueta de la OT de destino. */
  hacia: string;
}

export interface ResultadoReagrupacion<TLinea extends LineaReagrupable> {
  hijas: OrdenTrabajoHija[];
  lineas: TLinea[];
  /** Movimientos ya resueltos con nombres legibles (para la bitácora). */
  movimientos: MovimientoAplicado[];
  /** OT creadas por la propuesta. */
  otNuevas: Array<{ id: string; label: string }>;
}

function generarIdOtManual(): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `ot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `manual:${uuid}`;
}

function mismoValorOVacio(valores: string[]): string {
  const distintos = new Set(valores.map((valor) => valor.trim()).filter(Boolean));
  return distintos.size === 1 ? [...distintos][0]! : "";
}

/**
 * Aplica una propuesta ya validada. No modifica los argumentos: devuelve OT y líneas
 * nuevas. Una OT que se queda sin renglones desaparece; las OT nuevas toman almacén
 * y pedido de la OT de origen cuando todos sus renglones vienen de la misma.
 */
export function aplicarReagrupacion<TLinea extends LineaReagrupable>(params: {
  hijas: readonly OrdenTrabajoHija[];
  lineas: readonly TLinea[];
  propuesta: Pick<PropuestaReagrupacionApi, "ots">;
  indice: IndiceReagrupacion;
  /** Inyectable para pruebas. */
  generarIdOt?: () => string;
}): ResultadoReagrupacion<TLinea> {
  const { hijas, lineas, propuesta, indice } = params;
  const generarIdOt = params.generarIdOt ?? generarIdOtManual;
  validarPropuestaContraBase(propuesta, hijas, indice);

  const hijaPorId = new Map(hijas.map((hija) => [hija.id, hija]));
  const posicionRenglon = new Map(indice.orden.map((id, posicion) => [id, posicion]));
  const lineasNuevas = lineas.map((linea) => ({ ...linea }));
  const movimientos: MovimientoAplicado[] = [];
  const otNuevas: Array<{ id: string; label: string }> = [];

  const nuevasHijas: OrdenTrabajoHija[] = [];
  for (const ot of propuesta.ots) {
    if (ot.renglonIds.length === 0) continue;

    const renglonIds = [...ot.renglonIds].sort(
      (a, b) => posicionRenglon.get(a)! - posicionRenglon.get(b)!,
    );
    const indexados = renglonIds.map((id) => indice.porRenglonId.get(id)!);
    const renglones = indexados.map((item) => item.renglon);
    const totalCantidad = renglones.reduce(
      (suma, renglon) => suma + parseCantidadRenglon(renglon.Cantidad),
      0,
    );

    let base: OrdenTrabajoHija;
    if (ot.otId !== null) {
      base = { ...hijaPorId.get(ot.otId)!, renglones, totalCantidad };
    } else {
      const origenes = indexados.map(
        (item) => hijaPorId.get(item.otIdOrigen)!,
      );
      const almacen = mismoValorOVacio(origenes.map((origen) => origen.almacen));
      const numeroPedido = mismoValorOVacio(origenes.map((origen) => origen.numeroPedido));
      const etiqueta =
        sanitizarEtiqueta(ot.etiquetaSugerida) || ETIQUETA_OT_NUEVA_POR_DEFECTO;
      base = {
        id: generarIdOt(),
        label: etiqueta,
        numeroPedido,
        almacen,
        referenciaPedido: mismoValorOVacio(origenes.map((origen) => origen.referenciaPedido)),
        fecha: mismoValorOVacio(origenes.map((origen) => origen.fecha)),
        responsableExterno: mismoValorOVacio(
          origenes.map((origen) => origen.responsableExterno),
        ),
        renglones,
        totalCantidad,
      };
    }
    nuevasHijas.push(base);
    if (ot.otId === null) otNuevas.push({ id: base.id, label: base.label });

    for (const item of indexados) {
      if (item.otIdOrigen !== base.id) {
        movimientos.push({
          producto: texto(item.renglon.Producto),
          cantidad: parseCantidadRenglon(item.renglon.Cantidad),
          desde: hijaPorId.get(item.otIdOrigen)!.label,
          hacia: base.label,
        });
      }
      if (item.lineaIndex === null) continue;
      lineasNuevas[item.lineaIndex]!.otId = base.id;
    }
  }

  return {
    hijas: nuevasHijas,
    lineas: lineasNuevas,
    movimientos,
    otNuevas,
  };
}

/** Copia profunda del estado previo para poder deshacer (R10). */
export function crearSnapshotReagrupacion<TLinea extends LineaReagrupable>(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly TLinea[],
): { hijas: OrdenTrabajoHija[]; lineas: TLinea[] } {
  return {
    hijas: structuredClone(hijas) as OrdenTrabajoHija[],
    lineas: structuredClone(lineas) as TLinea[],
  };
}

/** Solo se puede reagrupar una OV por confirmar y con al menos una OT (R1). */
export function puedeReagruparOt(
  estadoOrdenVenta: string | null | undefined,
  cantidadOts: number,
): boolean {
  return (
    (estadoOrdenVenta ?? "").trim().toLowerCase() === "por_confirmar" &&
    cantidadOts >= 1
  );
}

/**
 * Firma estable de lo que ve el modelo (OT, renglones y a qué OT pertenece cada línea).
 * Si cambia entre pedir y confirmar la propuesta, la propuesta ya no aplica (R5).
 */
export function firmaEstadoReagrupacion(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly LineaReagrupable[],
): string {
  return JSON.stringify([
    hijas.map((hija) => [
      hija.id,
      hija.renglones.map((renglon) => [
        texto(renglon.Producto),
        parseCantidadRenglon(renglon.Cantidad),
      ]),
    ]),
    lineas.map((linea) => [linea.otId ?? "", linea.nombre, linea.cantidadInput]),
  ]);
}

const MAX_INSTRUCCION_BITACORA = 500;

/** Mensaje y datos de bitácora de una reagrupación guardada (R12). */
export function describirReagrupacionParaBitacora(params: {
  autor: string;
  instruccion: string;
  resumen: ResumenReagrupacion;
  movimientos: readonly MovimientoAplicado[];
  otNuevas: ReadonlyArray<{ id: string; label: string }>;
}): { mensaje: string; payloadExtra: Record<string, unknown> } {
  const { resumen } = params;
  const nuevas =
    params.otNuevas.length > 0
      ? ` (${params.otNuevas.length} ${params.otNuevas.length === 1 ? "nueva" : "nuevas"})`
      : "";
  return {
    mensaje: `Órdenes de trabajo reagrupadas con IA por ${params.autor}: ${resumen.antes} → ${resumen.despues}${nuevas}.`,
    payloadExtra: {
      reagrupacionIa: {
        instruccion: Array.from(params.instruccion.trim())
          .slice(0, MAX_INSTRUCCION_BITACORA)
          .join(""),
        resumen,
        movimientos: params.movimientos,
        otNuevas: params.otNuevas,
      },
    },
  };
}

export interface MovimientoVista {
  producto: string;
  cantidad: number | string;
  desde: string;
  hacia: string;
}

/**
 * Traduce los movimientos de la propuesta (ids opacos) a nombres legibles para la
 * vista previa. Solo usa texto del estado base y la etiqueta saneada de las OT nuevas.
 */
export function describirMovimientosPropuesta(
  propuesta: Pick<PropuestaReagrupacionApi, "ots" | "movimientos">,
  estadoBase: EstadoBaseApi,
): MovimientoVista[] {
  const etiquetaPorOt = new Map<string, string>(
    estadoBase.ots.map((ot) => [ot.otId, ot.etiqueta]),
  );
  for (const ot of propuesta.ots) {
    if (ot.nuevaClave !== null) {
      etiquetaPorOt.set(
        ot.nuevaClave,
        sanitizarEtiqueta(ot.etiquetaSugerida) || ETIQUETA_OT_NUEVA_POR_DEFECTO,
      );
    }
  }
  const renglonPorId = new Map(
    estadoBase.ots.flatMap((ot) =>
      ot.renglones.map((renglon) => [renglon.renglonId, renglon] as const),
    ),
  );

  return propuesta.movimientos.flatMap((movimiento) => {
    const renglon = renglonPorId.get(movimiento.renglonId);
    if (!renglon) return [];
    return [
      {
        producto: renglon.producto,
        cantidad: renglon.cantidad,
        desde: etiquetaPorOt.get(movimiento.deOtId) ?? movimiento.deOtId,
        hacia: etiquetaPorOt.get(movimiento.aOtId) ?? movimiento.aOtId,
      },
    ];
  });
}
