/**
 * Tablas de plataforma que siempre viven en `public`.
 * El resto de tablas de negocio usan el schema emp_* de la empresa.
 */
export const PLATFORM_TABLES = new Set([
  "empresa",
  "usuario",
  "rol",
  "security_event",
]);

export function isPlatformTable(table: string): boolean {
  return PLATFORM_TABLES.has(table);
}

function slugifyIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Mismo criterio que public.wms_normalize_schema_name:
 * emp_<razon_social>_<codigo> (ej. emp_andino_4v053).
 */
export function normalizeEmpresaSchemaName(
  codigoEmpresa: string,
  razonSocial?: string | null,
): string {
  const codigo = slugifyIdentifier(codigoEmpresa);
  const razon = razonSocial ? slugifyIdentifier(razonSocial) : "";

  let name = razon ? `emp_${razon}_${codigo}` : `emp_${codigo}`;
  if (name.length > 63) {
    name = `${name.slice(0, Math.max(0, 63 - 1 - codigo.length))}_${codigo}`.slice(
      0,
      63,
    );
  }
  return name;
}
