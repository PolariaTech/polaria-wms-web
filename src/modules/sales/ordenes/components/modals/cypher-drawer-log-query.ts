/**
 * Parámetros de lectura de bitácora Cypher.
 * REQ-325: no incluir autor desde `vendedor` — ese campo es mutable y
 * pisaba la creación (Mateo/SISTEMA) con el nombre del último editor.
 */
export function buildCypherLogQuery(params: {
  idOrdenVenta: string;
  codigoCuenta: string;
  idOrdenTrabajo: string | null;
  createdAt?: string | null;
}): {
  idOrdenVenta: string;
  codigoCuenta: string;
  idOrdenTrabajo: string | null;
  createdAt?: string | null;
} {
  return {
    idOrdenVenta: params.idOrdenVenta,
    codigoCuenta: params.codigoCuenta,
    idOrdenTrabajo: params.idOrdenTrabajo,
    createdAt: params.createdAt ?? null,
  };
}
