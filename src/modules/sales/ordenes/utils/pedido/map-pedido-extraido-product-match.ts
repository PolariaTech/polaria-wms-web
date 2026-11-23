import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import type { FuenteAsignacion } from "../../../shared/types/sales.types";
import { fraseClienteAmbigua, productoPorFraseCliente } from "../match/frase-cliente";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import { rankSinCodigoContradicho } from "../match/codigo-contradice-nombre";
import {
  findTypoRivalProductos,
  productoCompatibleConTextoCliente,
} from "../match/find-closest-producto-catalogo";
import { sustantivoPrincipalAusente } from "../match/sustantivo-principal";
import type { SugerenciaProductoCatalogo } from "./map-pedido-extraido-to-form.types";
import {
  extractCodigoFromCatalogKey,
  normalizeCatalogKey,
  norm,
  productoUnicoPorCodigo,
} from "./map-pedido-extraido-catalog-helpers";

/**
 * Orden: código único del cliente, frase del comprador, clave de Mateo.
 * Nunca fuzzy libre aquí: eso solo alimenta sugerencias pendientes.
 */
export function resolveProductoMatch(
  linea: {
    textoOriginal?: string | null;
    productoCatalogo: string | null;
    codigoProductoCliente?: string | null;
  },
  byKey: Map<string, ProductoVentaOption>,
  byCodigo: Map<string, ProductoVentaOption[]>,
  byKeyNorm: Map<string, ProductoVentaOption>,
  indiceFrases: ReadonlyMap<string, ProductoVentaOption | null>,
): { producto: ProductoVentaOption; fuente: FuenteAsignacion } | undefined {
  const textoCliente = linea.textoOriginal?.trim() || "";
  const skuOk = { codigoYaCoincide: true } as const;
  const accept = (p: ProductoVentaOption | undefined, opts?: { codigoYaCoincide?: boolean }) =>
    p && productoCompatibleConTextoCliente(textoCliente, p, opts) && !sustantivoPrincipalAusente(textoCliente, p)
      ? p
      : undefined;

  const porCodigoCliente = accept(productoUnicoPorCodigo(linea.codigoProductoCliente, byCodigo), skuOk);
  if (porCodigoCliente) return { producto: porCodigoCliente, fuente: "codigo" };
  const porCodigoEnTexto = accept(
    productoUnicoPorCodigo(extractCodigoFromCatalogKey(textoCliente), byCodigo),
    skuOk,
  );
  if (porCodigoEnTexto) return { producto: porCodigoEnTexto, fuente: "codigo" };

  if (fraseClienteAmbigua(textoCliente, indiceFrases)) return undefined;
  const porFrase = productoPorFraseCliente(textoCliente, indiceFrases);
  if (porFrase) return { producto: porFrase, fuente: "frase" };

  const clave = linea.productoCatalogo?.trim();
  if (!clave) return undefined;
  const exact = accept(byKey.get(clave));
  if (exact) return { producto: exact, fuente: "catalogo" };
  const byNorm = accept(byKeyNorm.get(normalizeCatalogKey(clave)));
  if (byNorm) return { producto: byNorm, fuente: "catalogo" };
  const porCodigoClave = accept(
    productoUnicoPorCodigo(extractCodigoFromCatalogKey(clave), byCodigo),
  );
  if (porCodigoClave) return { producto: porCodigoClave, fuente: "catalogo" };
  return undefined;
}

export function toSugerencia(
  producto: ProductoVentaOption,
): SugerenciaProductoCatalogo {
  return {
    idProducto: producto.idProducto,
    nombre: stripLeadingProductoCodigo(producto.nombre, producto.codigo),
    codigo: producto.codigo,
    idBodega: producto.idBodega,
    kgDisponible: producto.kgDisponible,
    unidadMedida: producto.unidadMedida,
    precioUnitario: producto.precioUnitario,
  };
}

/**
 * Rivales solo por typo (jass/hass). Variantes de talla/color de la misma familia
 * no cuentan: si Mateo/SKU ya encontró el producto, se asigna sin pedir confirmación.
 */
export function findVecinosAmbiguos(
  query: string,
  chosen: ProductoVentaOption,
  productos: ProductoVentaOption[],
): ProductoVentaOption[] {
  if (!query.trim()) return [];
  return findTypoRivalProductos(query, chosen, productos);
}

/**
 * Rankea sugerencias cruzando texto del cliente, clave Mateo y SKU cliente.
 * Fusiona candidatos y marca ambigüedad si hay empate cercano.
 */
export function pickSugerencias(
  linea: {
    textoOriginal?: string | null;
    productoCatalogo?: string | null;
    codigoProductoCliente?: string | null;
  },
  productos: ProductoVentaOption[],
): {
  sugerencia: SugerenciaProductoCatalogo | null;
  alternativas: SugerenciaProductoCatalogo[];
  ambiguo: boolean;
  topScore: number;
  secondScore: number | null;
  queryUsed: string;
} {
  // REQ-311: no usar productoCatalogo como query fuzzy — una clave Mateo
  // equivocada (PULPA, otro color) contaminaba sugerencias y dejaba amarillo.
  const queries = [
    linea.textoOriginal?.trim(),
    linea.codigoProductoCliente?.trim(),
  ].filter((q): q is string => Boolean(q));

  if (queries.length === 0 || productos.length === 0) {
    return {
      sugerencia: null,
      alternativas: [],
      ambiguo: false,
      topScore: 0,
      secondScore: null,
      queryUsed: "",
    };
  }

  const byId = new Map<
    string,
    { producto: ProductoVentaOption; score: number }
  >();
  let anyAmbiguous = false;
  let queryUsed = queries[0] ?? "";

  for (const query of queries) {
    const ranked = rankSinCodigoContradicho(query, productos, linea);
    if (ranked.ambiguous) anyAmbiguous = true;
    for (const candidate of ranked.candidates) {
      const prev = byId.get(candidate.producto.idProducto);
      if (!prev || candidate.score > prev.score) {
        byId.set(candidate.producto.idProducto, candidate);
        if (!prev || candidate.score > prev.score) {
          queryUsed = query;
        }
      }
    }
  }

  const merged = [...byId.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.producto.nombre.localeCompare(b.producto.nombre, "es");
  });

  if (merged.length === 0) {
    return {
      sugerencia: null,
      alternativas: [],
      ambiguo: false,
      topScore: 0,
      secondScore: null,
      queryUsed,
    };
  }

  const top = merged[0]!;
  const second = merged[1];
  const closeTie =
    Boolean(second) && top.score - (second?.score ?? 0) < 0.1;

  return {
    sugerencia: toSugerencia(top.producto),
    alternativas: merged.slice(1, 3).map((c) => toSugerencia(c.producto)),
    ambiguo: anyAmbiguous || closeTie,
    topScore: top.score,
    secondScore: second?.score ?? null,
    queryUsed,
  };
}