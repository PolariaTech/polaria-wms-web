/** Construye opciones de select a partir del catálogo de BD (tmp / definitivo). */
export function buildCompradorGrupoSelectOptions(
  grupos: readonly string[],
): { value: string; label: string }[] {
  const unique = [
    ...new Set(
      grupos
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ].sort((left, right) => left.localeCompare(right, "es"));

  return [
    { value: "", label: "—" },
    ...unique.map((nombre) => ({ value: nombre, label: nombre })),
  ];
}

/** Lista ordenada de nombres de grupo (sin vacío). */
export function normalizeCompradorGrupoValues(
  grupos: readonly string[],
): string[] {
  return [
    ...new Set(
      grupos
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ].sort((left, right) => left.localeCompare(right, "es"));
}
