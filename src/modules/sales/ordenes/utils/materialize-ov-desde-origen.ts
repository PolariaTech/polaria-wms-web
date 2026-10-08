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

export interface MaterializeLineaPlan {
  idProducto: string;
  cantidadPedida: number;
  precioUnitario: number;
  aliasCliente: string;
  codigoProductoCliente: string;
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

/** Normaliza fechas ISO-ish del tercero a YYYY-MM-DD. */
export function parseFechaOrigen(
  value: string | null | undefined,
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso?.[1]) return iso[1];
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    const dd = dmy[1]!.padStart(2, "0");
    const mm = dmy[2]!.padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
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
  const idComprador =
    shouldAutoAssignComprador(compradorRank)?.idComprador ??
    (compradorRank.candidates[0] &&
    compradorRank.candidates[0].score >= 0.45
      ? compradorRank.candidates[0].comprador.idComprador
      : null);

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
    lineas.push({
      idProducto: match.idProducto,
      cantidadPedida: cantidad,
      precioUnitario: precioDoc ?? match.precioUnitario ?? 0,
      aliasCliente: alias,
      codigoProductoCliente: renglon["Codigo producto"]?.trim() || "",
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
