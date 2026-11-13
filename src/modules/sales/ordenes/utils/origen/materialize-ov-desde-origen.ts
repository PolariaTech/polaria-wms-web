import type { CompradorListRow } from "@/modules/admin-panel";
import type {
  FuenteAsignacion,
  MatchProductoLinea,
  ProductoVentaOption,
} from "../../../shared/types/sales.types";
import { codigoContradiceNombre, rankSinFamiliaAjena } from "../match/codigo-contradice-nombre";
import { buildMatchProductoLinea } from "../match/build-match-producto";
import {
  fraseClienteAmbigua,
  indiceFrasesCliente,
  productoPorFraseCliente,
} from "../match/frase-cliente";
import {
  productoCompatibleConTextoCliente,
  shouldAutoAcceptProductoSuggestion,
} from "../match/find-closest-producto-catalogo";
import {
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";
import {
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "../match/match-comprador-from-nombre";
import {
  asignarMadurezAProductos,
  madurezDesdeRegistro,
} from "../pedido/madurez-linea";
import {
  especificacionConPiezas,
  piezasAproxKgParaLinea,
} from "../pedido/piezas-aprox-kg";
import { resolveCantidadPrecioDesdeEnvase } from "../pedido/resolve-cantidad-envase";
import { resolveEspecificacionPedidoLinea } from "../pedido/resolve-especificacion-pedido-linea";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import {
  parseCantidad,
  parseFechaOrigen,
  parsePrecio,
} from "./parse-origen-renglon";

export {
  parseFechaOrigen,
  resolveFechaEntregaDesdeOrigen,
} from "./parse-origen-renglon";

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
  matchProducto: MatchProductoLinea;
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

function resolveProductoForRenglon(
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
    if (byCodigo.length === 1 && !codigoContradiceNombre(renglon.Producto, codigo, byCodigo[0]!)) {
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

/**
 * Arma el plan de materialización a partir de origen_correo + catálogos.
 * No escribe en BD.
 */
export function buildMaterializeOvDesdeOrigenPlan(params: {
  origenCorreo: unknown;
  productos: readonly ProductoVentaOption[];
  compradores: readonly CompradorListRow[];
  /** Cuerpo del correo, si todavía trae la columna de maduración. */
  origenTexto?: string | null;
}): MaterializeOvPlan {
  const renglones = parseOrigenCorreoJson(params.origenCorreo);
  const nombreClienteOrigen =
    renglones.map((r) => r["Nombre cliente"]?.trim()).find(Boolean) ?? null;
  const idComprador = compradorDesdeOrigen({
    origenCorreo: params.origenCorreo,
    compradores: params.compradores,
  });
  const indiceFrases = indiceFrasesCliente(params.productos);

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
  const niveles = asignarMadurezAProductos({
    productos: renglones.map((renglon) => renglon.Producto?.trim() || ""),
    textoFuente: params.origenTexto,
    madurezPorRenglon: renglones.map((renglon) => madurezDesdeRegistro(renglon)),
  });

  for (let index = 0; index < renglones.length; index++) {
    const renglon = renglones[index]!;
    const alias = renglon.Producto?.trim() || "";
    const piezas = piezasAproxKgParaLinea({
      producto: alias,
      textosLinea: [
        alias,
        typeof renglon.Cantidad === "string" ? renglon.Cantidad : null,
      ],
      textoFuente: params.origenTexto,
    });
    const cantidad = piezas?.kg ?? parseCantidad(renglon.Cantidad);
    if (cantidad <= 0) continue;

    const resolucion = resolveProductoForRenglon(
      renglon,
      params.productos,
      indiceFrases,
    );
    if (!resolucion) {
      if (alias) sinMatchProductos.push(alias);
      continue;
    }
    const match = resolucion.producto;
    const matchProducto = buildMatchProductoLinea({
      textoCliente: alias,
      sugeridoMateo: {
        idProducto: match.idProducto,
        nombre: match.nombre,
        codigo: match.codigo,
      },
      elegidoUsuario: {
        idProducto: match.idProducto,
        nombre: match.nombre,
        codigo: match.codigo,
      },
      fuente: resolucion.fuente,
    });
    if (!matchProducto) continue;

    const precioDoc = parsePrecio(renglon.Precio);
    const converted = resolveCantidadPrecioDesdeEnvase({
      textoOriginal: alias,
      unidadMedidaCatalogo: match.unidadMedida,
      cantidadRaw: cantidad,
      precioDoc,
    });
    lineas.push({
      idProducto: match.idProducto,
      cantidadPedida: piezas ? piezas.kg : (converted?.cantidad ?? cantidad),
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
      especificacion: especificacionConPiezas(
        resolveEspecificacionPedidoLinea({
          especificacionIa: niveles[index] ?? null,
          envase: converted,
          textoOriginal: alias,
          especificacionOrigen: renglon.Especificacion,
        }),
        piezas,
      ),
      matchProducto,
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
