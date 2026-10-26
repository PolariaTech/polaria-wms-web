import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import {
  findClosestProductoCatalogo,
  rankProductosCatalogo,
  shouldAutoAcceptProductoSuggestion,
} from "./find-closest-producto-catalogo";
import {
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";
import {
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "./match-comprador-from-nombre";
import {
  formatEspecificacionEnvase,
  resolveCantidadPrecioDesdeEnvase,
} from "./resolve-cantidad-envase";
import { stripLeadingProductoCodigo } from "../../shared/utils/producto-venta-nombre";

export interface MaterializeLineaPlan {
  idProducto: string;
  cantidadPedida: number;
  precioUnitario: number;
  /** Unidad del catálogo (o convertida) que debe persistir en la línea. */
  unidadMedida: string;
  aliasCliente: string;
  codigoProductoCliente: string;
  /** Nombre de catálogo para notas_lineas / PDF. */
  nombreProducto: string;
  /** REQ-124: frase de envase u otra especificación a persistir. */
  especificacion: string;
}

export interface MaterializeOvPlan {
  idComprador: string | null;
  ordenCompraHotel: string | null;
  centroConsumo: string | null;
  contactoEntrega: string | null;
  fechaEntrega: string | null;
  lineas: MaterializeLineaPlan[];
  sinMatchProductos: string[];
  nombreClienteOrigen: string | null;
}

function parseCantidad(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parsePrecio(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function pad2Fecha(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD solo si el calendario es real (evita 2026-24-10). */
function ymdIfValid(year: number, month: number, day: number): string | null {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() + 1 !== month ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2Fecha(month)}-${pad2Fecha(day)}`;
}

/**
 * Resuelve a/b/yyyy ambiguo (DD/MM LatAm vs MM/DD US/BirchStreet).
 * Si solo una interpretación es calendario válido, la usa; si ambas, preferir DMY.
 */
function parseSlashDateParts(
  first: number,
  second: number,
  year: number,
): string | null {
  const asDmy = ymdIfValid(year, second, first);
  const asMdy = ymdIfValid(year, first, second);
  if (asDmy && !asMdy) return asDmy;
  if (asMdy && !asDmy) return asMdy;
  if (asDmy && asMdy) return asDmy;
  return null;
}

/**
 * Normaliza fechas del tercero a YYYY-MM-DD.
 * Acepta ISO y slash dates (DD/MM o MM/DD); BirchStreet `10/24/2026` → 2026-10-24.
 */
export function parseFechaOrigen(
  value: string | null | undefined,
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const iso = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso?.[1]) {
    const [y, m, d] = iso[1].split("-").map(Number);
    return ymdIfValid(y!, m!, d!);
  }
  const slash = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (!slash) return null;
  const first = Number(slash[1]);
  const second = Number(slash[2]);
  const yearRaw = slash[3]!;
  const year =
    yearRaw.length === 2
      ? Number(yearRaw) >= 70
        ? 1900 + Number(yearRaw)
        : 2000 + Number(yearRaw)
      : Number(yearRaw);
  return parseSlashDateParts(first, second, year);
}

/**
 * Fecha de entrega desde OTs / origen_correo (adjuntos BirchStreet, etc.).
 * REQ-110: no confirmar a ciegas si el form está vacío pero el origen trae Fecha.
 */
export function resolveFechaEntregaDesdeOrigen(params: {
  origenCorreo: OrigenCorreoRenglon[];
  hijas?: Array<{ fecha?: string | null }>;
}): string | null {
  for (const hija of params.hijas ?? []) {
    const fromHija = parseFechaOrigen(hija.fecha);
    if (fromHija) return fromHija;
  }
  for (const row of params.origenCorreo) {
    const fromRow = parseFechaOrigen(row.Fecha);
    if (fromRow) return fromRow;
  }
  return null;
}

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

function cleanProductoQuery(raw: string): string {
  return raw
    .replace(/¥/g, "ñ")
    .replace(/\uFFFD/g, "n")
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveProductoForRenglon(
  renglon: OrigenCorreoRenglon,
  productos: readonly ProductoVentaOption[],
): ProductoVentaOption | null {
  const query = cleanProductoQuery(
    renglon.Producto?.trim() ||
      renglon["Codigo producto"]?.trim() ||
      "",
  );
  if (!query) return null;

  const codigo = renglon["Codigo producto"]?.trim();
  if (codigo) {
    const byCodigo = productos.filter(
      (p) => p.codigo.trim().toLowerCase() === codigo.toLowerCase(),
    );
    if (byCodigo.length === 1) return byCodigo[0]!;
  }

  const ranked = rankProductosCatalogo(query, productos, { limit: 3 });
  const top = ranked.candidates[0];
  if (!top) return null;

  const auto = shouldAutoAcceptProductoSuggestion({
    query,
    sugerenciaNombre: top.producto.nombre,
    sugerenciaCodigo: top.producto.codigo,
    topScore: top.score,
    secondScore: ranked.candidates[1]?.score ?? null,
    ambiguous: ranked.ambiguous,
  });
  if (auto) return top.producto;

  // Integración externa: umbral un poco más agresivo para no dejar OV vacía.
  if (top.score >= 0.4) return top.producto;

  return findClosestProductoCatalogo(query, productos);
}

/**
 * Arma el plan de materialización a partir de origen_correo + catálogos.
 * No escribe en BD.
 */
export function buildMaterializeOvDesdeOrigenPlan(params: {
  origenCorreo: unknown;
  productos: readonly ProductoVentaOption[];
  compradores: readonly CompradorListRow[];
}): MaterializeOvPlan {
  const renglones = parseOrigenCorreoJson(params.origenCorreo);
  const nombreClienteOrigen =
    renglones.map((r) => r["Nombre cliente"]?.trim()).find(Boolean) ?? null;

  const compradorRank = rankCompradoresFromNombre(
    nombreClienteOrigen,
    params.compradores,
  );
  // Solo auto-asigna con match exacto; parciales se resuelven en UI como sugerencias.
  const idComprador =
    shouldAutoAssignComprador(compradorRank)?.idComprador ?? null;

  const ordenCompraHotel =
    mostFrequent(
      renglones.map((r) => (r["Numero pedido"] ?? "").toString()),
    ) ?? null;
  const centroConsumo =
    mostFrequent(renglones.map((r) => (r.Almacen ?? "").toString())) ?? null;
  const contactoEntrega =
    mostFrequent(
      renglones.map((r) => (r["Responsable externo"] ?? "").toString()),
    ) ?? null;
  const fechaEntrega =
    parseFechaOrigen(
      renglones.map((r) => r.Fecha?.trim()).find(Boolean) ?? null,
    ) ?? null;

  const lineas: MaterializeLineaPlan[] = [];
  const sinMatchProductos: string[] = [];

  for (const renglon of renglones) {
    const cantidad = parseCantidad(renglon.Cantidad);
    if (cantidad <= 0) continue;

    const match = resolveProductoForRenglon(renglon, params.productos);
    const alias = renglon.Producto?.trim() || "";
    if (!match) {
      if (alias) sinMatchProductos.push(alias);
      continue;
    }

    const precioDoc = parsePrecio(renglon.Precio);
    const converted = resolveCantidadPrecioDesdeEnvase({
      textoOriginal: alias,
      unidadMedidaCatalogo: match.unidadMedida,
      cantidadRaw: cantidad,
      precioDoc,
    });
    lineas.push({
      idProducto: match.idProducto,
      cantidadPedida: converted?.cantidad ?? cantidad,
      precioUnitario:
        converted?.precioUnitario ??
        precioDoc ??
        match.precioUnitario ??
        0,
      unidadMedida: match.unidadMedida?.trim() || "",
      aliasCliente: alias,
      codigoProductoCliente: renglon["Codigo producto"]?.trim() || "",
      nombreProducto: stripLeadingProductoCodigo(
        match.nombre,
        match.codigo,
      ),
      especificacion: converted
        ? formatEspecificacionEnvase(converted)
        : "",
    });
  }

  return {
    idComprador,
    ordenCompraHotel,
    centroConsumo,
    contactoEntrega,
    fechaEntrega,
    lineas,
    sinMatchProductos,
    nombreClienteOrigen,
  };
}
