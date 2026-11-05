/**
 * REQ-259: RFC visible en el recuadro de datos del cliente (misma fuente que Cypher).
 */
export function resolveRfcClienteCatalogo(input: {
  fichaRfc?: string | null;
  catalogoRfc?: string | null;
}): string {
  const desdeFicha = (input.fichaRfc ?? "").trim();
  if (desdeFicha) return desdeFicha;
  return (input.catalogoRfc ?? "").trim();
}
