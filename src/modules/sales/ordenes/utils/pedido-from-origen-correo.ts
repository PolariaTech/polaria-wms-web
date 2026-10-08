import type { PedidoExtraido, LineaExtraida } from "../ai/openai-pedido.client";
import {
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

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

function parseFecha(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso?.[1] ?? null;
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
}): PedidoExtraido {
  const rows = parseOrigenCorreoJson(params.origenCorreo);
  const lineas: LineaExtraida[] = rows.map((row) => ({
    textoOriginal: row.Producto?.trim() || row["Codigo producto"]?.trim() || "",
    productoCatalogo: null,
    cantidad: parseCantidad(row.Cantidad),
    unidad: null,
    cajas: null,
    presentacion: null,
    especificacion: null,
    numeroPedido: row["Numero pedido"]?.trim() || null,
    almacen: row.Almacen?.trim() || null,
    numeroAlmacen: row["Numero almacen"]?.trim() || null,
    referenciaPedido: row["Referencia pedido"]?.trim() || null,
    codigoProductoCliente: row["Codigo producto"]?.trim() || null,
    responsableExterno: row["Responsable externo"]?.trim() || null,
    precioUnitario: parsePrecio(row.Precio),
  }));

  const notasFromRows = firstNonEmpty(rows, (r) => r["Notas generales"]);
  const destino = firstNonEmpty(rows, (r) => r.Destino);

  return {
    fechaEntrega: parseFecha(firstNonEmpty(rows, (r) => r.Fecha)),
    centroConsumo: mostFrequent(rows.map((r) => (r.Almacen ?? "").toString())),
    observaciones: notasFromRows || params.notasAlmacen?.trim() || null,
    notasGeneralesAlmacen: notasFromRows || params.notasAlmacen?.trim() || null,
    ordenCompraHotel: mostFrequent(
      rows.map((r) => (r["Numero pedido"] ?? "").toString()),
    ),
    nombreCliente: firstNonEmpty(rows, (r) => r["Nombre cliente"]),
    rfc: null,
    regimen: null,
    direccion:
      firstNonEmpty(rows, (r) => r["Direccion entrega"]) || destino || null,
    anden: firstNonEmpty(rows, (r) => r.Anden),
    contacto: mostFrequent(
      rows.map((r) => (r["Responsable externo"] ?? "").toString()),
    ),
    telefono: firstNonEmpty(rows, (r) => r["Telefono contacto"]),
    horarioDesde: firstNonEmpty(rows, (r) => r["Ventana desde"]),
    horarioHasta: firstNonEmpty(rows, (r) => r["Ventana hasta"]),
    tolerancia: null,
    sustituciones: null,
    lote: null,
    temperatura: null,
    lineas,
    origenCorreo: rows,
    advertencia: rows.length === 0 ? "Sin renglones en origen_correo." : null,
    archivosNoLegibles: [],
    textoOrigen: params.origenTexto?.trim() || null,
  };
}
