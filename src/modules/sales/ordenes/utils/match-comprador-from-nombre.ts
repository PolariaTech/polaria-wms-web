import type { CompradorListRow } from "@/modules/admin-panel";

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Match estricto: nombre o código exactamente iguales (normalizados).
 * Sin fuzzy/contains — evita asignar el comprador equivocado.
 */
export function matchCompradorFromNombre(
  nombreExtraido: string | null | undefined,
  compradores: readonly CompradorListRow[],
): CompradorListRow | null {
  const needle = normalizeMatchText(nombreExtraido ?? "");
  if (!needle || compradores.length === 0) return null;

  const activos = compradores.filter((row) => row.estaActivo !== false);
  const pool = activos.length > 0 ? activos : compradores;

  return (
    pool.find((row) => {
      const nombre = normalizeMatchText(row.comprador);
      const codigo = normalizeMatchText(row.codigo);
      return nombre === needle || codigo === needle;
    }) ?? null
  );
}
