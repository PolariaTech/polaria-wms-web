import {
  isGarbageOcValue,
  resolveOrdenCompraLimpia,
} from "./normalize-numero-pedido";
import {
  parseOrdenVentaCapturaObservaciones,
  stripSurtidoFotoQrFromNotas,
} from "./build-orden-venta-captura-observaciones";
import {
  looksLikeCorreoCuerpoEnNotas,
  sanitizeNotasGeneralesPedido,
} from "../origen/texto-origen-pedido";
import { parseOrigenCorreoJson } from "../origen/origen-correo-ordenes-trabajo";
export {
  salirDeHoraConTab,
  useFocoOrdenCompraAlAbrir,
} from "./foco-formulario-ov";

/**
 * REQ-230: al reabrir en edición una OV de tercero (`por_confirmar`), lo que
 * el usuario ya guardó manda sobre lo que se reconstruye desde `origen_correo`.
 */

/**
 * OCC del formulario: la guardada gana si no es basura de OCR; si no hay una
 * válida guardada, se usa la propuesta (limpia) del correo.
 */
export function resolveOccGuardada(params: {
  guardada?: string | null;
  propuesta: string;
  origenTexto?: string | null;
}): string {
  const guardada = (params.guardada ?? "").trim();
  if (guardada && !isGarbageOcValue(guardada)) return guardada;
  return resolveOrdenCompraLimpia(params.propuesta, params.origenTexto ?? "");
}

/**
 * ¿El usuario borró las notas generales y guardó la OV? Es así cuando no hay
 * notas guardadas, la OV ya pasó por el formulario (tiene observaciones de
 * captura) y todas las filas de origen quedaron con "Notas generales" vacía
 * (REQ-141: vacío = las borró). Sin esa evidencia no se asume nada.
 */
export function usuarioBorroNotas(params: {
  notasGuardadas: string;
  filasOrigen: ReadonlyArray<{ "Notas generales"?: string }>;
  observacionesGuardadas?: string | null;
}): boolean {
  if (params.notasGuardadas.trim()) return false;
  if (!(params.observacionesGuardadas ?? "").trim()) return false;
  if (params.filasOrigen.length === 0) return false;
  return params.filasOrigen.every((fila) => fila["Notas generales"] === "");
}

/** Notas del formulario: lo guardado gana; borradas se quedan vacías. */
export function resolveNotasGuardadas(params: {
  notasGuardadas: string;
  propuesta: string;
  borradas: boolean;
}): string {
  const guardadas = params.notasGuardadas.trim();
  if (guardadas) return guardadas;
  if (params.borradas) return "";
  return params.propuesta;
}

/**
 * OCC y notas del formulario al reabrir la OV: lo guardado gana y la
 * reconstrucción desde el correo (`propuesta`) solo completa lo que falta.
 */
export function resolveCabeceraGuardada(params: {
  detalle: {
    notas_almacen?: string | null;
    observaciones?: string | null;
    orden_compra_hotel?: string | null;
    origen_texto?: string | null;
  };
  filasOrigen: ReadonlyArray<{ "Notas generales"?: string }>;
  propuesta: { observaciones: string; ordenCompraHotel: string };
}): { observaciones: string; ordenCompraHotel: string } {
  const { detalle, filasOrigen, propuesta } = params;
  const notasRaw = (
    stripSurtidoFotoQrFromNotas(detalle.notas_almacen ?? "") ||
    parseOrdenVentaCapturaObservaciones(detalle.observaciones).observaciones
  ).trim();
  // Una nota corta escrita por el usuario no es "basura de correo": solo se
  // limpia si de verdad es el cuerpo de un correo pegado.
  const notasGuardadas = looksLikeCorreoCuerpoEnNotas(notasRaw)
    ? sanitizeNotasGeneralesPedido(notasRaw)
    : notasRaw;
  return {
    observaciones: resolveNotasGuardadas({
      notasGuardadas,
      propuesta: propuesta.observaciones,
      borradas: usuarioBorroNotas({
        notasGuardadas,
        filasOrigen,
        observacionesGuardadas: detalle.observaciones,
      }),
    }),
    ordenCompraHotel: resolveOccGuardada({
      guardada: detalle.orden_compra_hotel,
      propuesta: propuesta.ordenCompraHotel,
      origenTexto: detalle.origen_texto,
    }),
  };
}

function textoClienteLimpio(value: string | null | undefined): string {
  const t = (value ?? "").trim();
  if (!t || t === "—") return "";
  return t;
}

/**
 * REQ-166: propuesta de cliente de Mateo (no el «Cliente» del Cypher-correo).
 * Se sella en origen al guardar avance si aún no hay id_comprador.
 */
export function resolvePropuestaClienteMateoParaGuardar(params: {
  idComprador?: string | null;
  nombreIa?: string | null;
  label?: string | null;
  nombreEnOrigen?: string | null;
}): string {
  if (textoClienteLimpio(params.idComprador)) return "";
  return (
    textoClienteLimpio(params.nombreIa) ||
    textoClienteLimpio(params.label) ||
    textoClienteLimpio(params.nombreEnOrigen) ||
    ""
  );
}

/** REQ-166: al reabrir sin catálogo, rehidratar el campo con la propuesta de Mateo. */
export function resolvePropuestaClienteMateoAlReabrir(params: {
  idComprador?: string | null;
  nombreEnOrigen?: string | null;
  nombrePedidoMateo?: string | null;
}): string {
  if (textoClienteLimpio(params.idComprador)) return "";
  return (
    textoClienteLimpio(params.nombrePedidoMateo) ||
    textoClienteLimpio(params.nombreEnOrigen) ||
    ""
  );
}

/** REQ-166: no perder «Nombre cliente» de Mateo al rearmar origen_correo desde el form. */
export function sellarNombreClienteMateoEnOrigen<
  T extends { "Nombre cliente"?: string },
>(rows: readonly T[], nombreCliente: string): T[] {
  const nombre = textoClienteLimpio(nombreCliente);
  if (!nombre || rows.length === 0) return [...rows];
  return rows.map((row) => ({
    ...row,
    "Nombre cliente": textoClienteLimpio(row["Nombre cliente"]) || nombre,
  }));
}

/**
 * REQ-169: en el listado, si no hay comprador de catálogo, mostrar el nombre
 * tentativo (propuesta Mateo / Nombre cliente en origen), no «—».
 */
export function resolveCompradorParaListado(params: {
  compradorCatalogo?: string | null;
  origenCorreo?: unknown;
}): string {
  const catalogo = textoClienteLimpio(params.compradorCatalogo);
  if (catalogo) return catalogo;
  const tentativo =
    parseOrigenCorreoJson(params.origenCorreo)
      .map((row) => row["Nombre cliente"]?.trim())
      .find((value): value is string => Boolean(value)) || "";
  return textoClienteLimpio(tentativo) || "—";
}
