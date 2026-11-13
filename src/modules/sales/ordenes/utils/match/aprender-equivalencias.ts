import { normalizeForMatch } from "./normalize-for-match";

export interface AprendizajeEquivalencia {
  frase: string;
  idProducto: string;
}

export function equivalenciasPorAprender(params: {
  lineas: readonly {
    idProducto?: string | null;
    aliasCliente?: string | null;
    nombre?: string | null;
    propuestaSistema?: {
      producto: { idProducto: string } | null;
    };
  }[];
  idComprador: string | null | undefined;
  idsProductoVenta: readonly string[];
}): AprendizajeEquivalencia[] {
  if (!params.idComprador?.trim()) return [];
  const idsVenta = new Set(params.idsProductoVenta);
  const porFrase = new Map<string, AprendizajeEquivalencia[]>();

  for (const linea of params.lineas) {
    const aprendizaje = aprendizajeDeLinea(linea, idsVenta);
    if (!aprendizaje) continue;
    const clave = normalizeForMatch(aprendizaje.frase);
    const lista = porFrase.get(clave) ?? [];
    lista.push(aprendizaje);
    porFrase.set(clave, lista);
  }

  const resultado: AprendizajeEquivalencia[] = [];
  for (const filas of porFrase.values()) {
    const productos = new Set(filas.map((fila) => fila.idProducto));
    if (productos.size !== 1) continue;
    resultado.push(filas[0]!);
  }
  return resultado;
}

function aprendizajeDeLinea(
  linea: {
    idProducto?: string | null;
    aliasCliente?: string | null;
    nombre?: string | null;
    propuestaSistema?: { producto: { idProducto: string } | null };
  },
  idsVenta: ReadonlySet<string>,
): AprendizajeEquivalencia | null {
  if (linea.propuestaSistema === undefined) return null;
  const idProducto = linea.idProducto?.trim() ?? "";
  if (!idProducto || !idsVenta.has(idProducto)) return null;
  const frase = (linea.aliasCliente || linea.nombre || "").trim().slice(0, 255);
  if (!normalizeForMatch(frase)) return null;
  const propuesto = linea.propuestaSistema.producto?.idProducto?.trim() || null;
  if (propuesto && propuesto === idProducto) return null;
  return { frase, idProducto };
}
