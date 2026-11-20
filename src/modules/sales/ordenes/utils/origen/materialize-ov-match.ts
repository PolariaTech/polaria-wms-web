import type { CompradorListRow } from "@/modules/admin-panel";
import type {
  FuenteAsignacion,
  ProductoVentaOption,
} from "../../../shared/types/sales.types";
import {
  codigoContradiceNombre,
  rankSinFamiliaAjena,
} from "../match/codigo-contradice-nombre";
import {
  fraseClienteAmbigua,
  productoPorFraseCliente,
} from "../match/frase-cliente";
import {
  productoCompatibleConTextoCliente,
  shouldAutoAcceptProductoSuggestion,
} from "../match/find-closest-producto-catalogo";
import {
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "../match/match-comprador-from-nombre";
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
  for (const [key, veces] of counts) {
    if (veces > bestN) {
      best = key;
      bestN = veces;
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

export function resolveProductoForRenglon(
  renglon: OrigenCorreoRenglon,
  productos: readonly ProductoVentaOption[],
  indiceFrases: ReadonlyMap<string, ProductoVentaOption | null>,
): { producto: ProductoVentaOption; fuente: FuenteAsignacion } | null {
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
    if (
      byCodigo.length === 1 &&
      !codigoContradiceNombre(renglon.Producto, codigo, byCodigo[0]!)
    ) {
      return { producto: byCodigo[0]!, fuente: "codigo" };
    }
  }

  if (fraseClienteAmbigua(query, indiceFrases)) return null;
  const porFrase = productoPorFraseCliente(query, indiceFrases);
  if (porFrase) return { producto: porFrase, fuente: "frase" };

  const ranked = rankSinFamiliaAjena(query, productos, { limit: 3 });
  const top = ranked.candidates[0];
  if (!top) return null;
  if (!productoCompatibleConTextoCliente(query, top.producto)) return null;
  const auto = shouldAutoAcceptProductoSuggestion({
    query,
    sugerenciaNombre: top.producto.nombre,
    sugerenciaCodigo: top.producto.codigo,
    topScore: top.score,
    secondScore: ranked.candidates[1]?.score ?? null,
    ambiguous: ranked.ambiguous,
  });
  if (auto) return { producto: top.producto, fuente: "difuso" };
  return null;
}

export function compradorDesdeOrigen(params: {
  origenCorreo: unknown;
  compradores: readonly CompradorListRow[];
}): string | null {
  const renglones = parseOrigenCorreoJson(params.origenCorreo);
  const nombreClienteOrigen =
    renglones.map((r) => r["Nombre cliente"]?.trim()).find(Boolean) ?? null;
  const compradorRank = rankCompradoresFromNombre(
    nombreClienteOrigen,
    params.compradores,
  );
  return (
    shouldAutoAssignComprador(compradorRank, nombreClienteOrigen)
      ?.idComprador ?? null
  );
}

export function valorMasFrecuente(values: string[]): string | null {
  return mostFrequent(values);
}
