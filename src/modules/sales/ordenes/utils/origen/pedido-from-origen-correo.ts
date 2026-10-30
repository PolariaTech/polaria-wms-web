import type { PedidoExtraido, LineaExtraida } from "../../ai/openai-pedido.client";
import { extractCorreoContactoDesdeTexto } from "./correo-chrome";
import { limpiarNotasBirchstreet } from "./notas-birchstreet";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
} from "../pedido/extract-entrega-desde-texto";
import { limpiarDireccionEntrega } from "../pedido/limpiar-direccion-birchstreet";
import { sanitizeTelefonoContactoOrNull } from "../pedido/sanitize-telefono-contacto";
import { parseFechaOrigen } from "./materialize-ov-desde-origen";
import {
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";
import {
  asignarMadurezAProductos,
  madurezDesdeRegistro,
} from "../pedido/madurez-linea";
import { aplicarPiezasAproxKg } from "../pedido/piezas-aprox-kg";
import {
  normalizeNumeroPedidoFields,
  sanitizeOrigenCorreoNumeroPedido,
} from "../pedido/normalize-numero-pedido";

function mostFrequent(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [key, n] of counts) {
    if (n > bestN) {
      best = key;
      bestN = n;
    }
  }
  return best;
}

function firstNonEmpty(
  rows: readonly OrigenCorreoRenglon[],
  getter: (row: OrigenCorreoRenglon) => string | null | undefined,
): string | null {
  for (const row of rows) {
    const value = getter(row)?.trim();
    if (value) return value;
  }
  return null;
}

function parseCantidad(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parsePrecio(value: number | string | undefined): number | null {
  const n = parseCantidad(value);
  return n != null && n > 0 ? n : null;
}

/**
 * Arma un PedidoExtraido desde origen_correo (sin llamar a OpenAI).
 * Mateo en UI usa esto + matching de catálogo al abrir una OV externa.
 */
export function buildPedidoExtraidoFromOrigenCorreo(params: {
  origenCorreo: unknown;
  /** Cuerpo / notas ya guardadas en la OV (si el tercero las mandó aparte). */
  origenTexto?: string | null;
  notasAlmacen?: string | null;
  /** Ancla para fechas relativas / mes sin año. Default: hoy UTC. */
  hoyISO?: string;
}): PedidoExtraido {
  const origenTexto = params.origenTexto?.trim() || null;
  const rowsRaw = parseOrigenCorreoJson(params.origenCorreo);
  const rows = sanitizeOrigenCorreoNumeroPedido(
    rowsRaw,
    origenTexto ?? "",
  );
  const textos = rows.map(
    (row) => row.Producto?.trim() || row["Codigo producto"]?.trim() || "",
  );
  const niveles = asignarMadurezAProductos({
    productos: textos,
    textoFuente: origenTexto,
    madurezPorRenglon: rows.map((row) => madurezDesdeRegistro(row)),
  });
  const lineasSinPiezas: LineaExtraida[] = rows.map((row, index) => ({
    textoOriginal: textos[index] ?? "",
    productoCatalogo: null,
    cantidad: parseCantidad(row.Cantidad),
    unidad: null,
    cajas: null,
    presentacion: null,
    especificacion: niveles[index] ?? null,
    numeroPedido: row["Numero pedido"]?.trim() || null,
    almacen: row.Almacen?.trim() || null,
    numeroAlmacen: row["Numero almacen"]?.trim() || null,
    referenciaPedido: row["Referencia pedido"]?.trim() || null,
    codigoProductoCliente: row["Codigo producto"]?.trim() || null,
    responsableExterno: row["Responsable externo"]?.trim() || null,
    precioUnitario: parsePrecio(row.Precio),
  }));
  const lineasRaw = aplicarPiezasAproxKg(
    lineasSinPiezas,
    origenTexto,
    rows.map((row) =>
      typeof row.Cantidad === "string" ? row.Cantidad : null,
    ),
  );

  const hotelRaw = mostFrequent(
    rows.map((r) => (r["Numero pedido"] ?? "").toString()),
  );
  const normalized = normalizeNumeroPedidoFields({
    ordenCompraHotel: hotelRaw,
    lineas: lineasRaw,
    sourceText: origenTexto ?? "",
  });
  const lineas = normalized.lineas;

  const notasRaw =
    firstNonEmpty(rows, (r) => r["Notas generales"]) ||
    params.notasAlmacen?.trim() ||
    "";
  const notasFromRows = limpiarNotasBirchstreet(notasRaw, origenTexto);
  const destino = firstNonEmpty(rows, (r) => r.Destino);
  const hoyISO =
    params.hoyISO?.trim() || new Date().toISOString().slice(0, 10);
  const fromBody = extractEntregaDesdeTexto(
    [origenTexto, notasRaw].filter(Boolean).join("\n"),
    hoyISO,
  );

  const fechaFromRows = parseFechaOrigen(firstNonEmpty(rows, (r) => r.Fecha));
  const horarioDesdeRow = firstNonEmpty(rows, (r) => r["Ventana desde"]);
  const horarioHastaRow = firstNonEmpty(rows, (r) => r["Ventana hasta"]);

  return {
    fechaEntrega: fechaFromRows || fromBody.fechaIso,
    centroConsumo: mostFrequent(rows.map((r) => (r.Almacen ?? "").toString())),
    observaciones: notasFromRows || null,
    notasGeneralesAlmacen: notasFromRows || null,
    ordenCompraHotel: normalized.ordenCompraHotel,
    nombreCliente: firstNonEmpty(rows, (r) => r["Nombre cliente"]),
    rfc: null,
    regimen: null,
    direccion:
      extractDireccionShipToDesdeTexto(origenTexto) ||
      limpiarDireccionEntrega(
        firstNonEmpty(rows, (r) => r["Direccion entrega"]) || destino,
      ),
    anden: firstNonEmpty(rows, (r) => r.Anden),
    contacto: mostFrequent(
      rows.map((r) => (r["Responsable externo"] ?? "").toString()),
    ),
    telefono: sanitizeTelefonoContactoOrNull(
      firstNonEmpty(rows, (r) => r["Telefono contacto"]),
    ),
    correo:
      extractCorreoContactoDesdeTexto(origenTexto) ||
      firstNonEmpty(rows, (r) => r["Correo contacto"]) ||
      null,
    horarioDesde: horarioDesdeRow || fromBody.horarioDesde,
    horarioHasta: horarioHastaRow || fromBody.horarioHasta,
    tolerancia: null,
    sustituciones: null,
    lote: null,
    temperatura: null,
    lineas,
    origenCorreo: rows,
    advertencia: rows.length === 0 ? "Sin renglones en origen_correo." : null,
    archivosNoLegibles: [],
    textoOrigen: origenTexto,
  };
}
