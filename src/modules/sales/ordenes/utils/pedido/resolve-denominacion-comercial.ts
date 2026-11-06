/**
 * REQ-241: denominación visible = override WMS (si existe) o apodo sincronizado.
 * El sync del tercero sigue escribiendo `apodo`; el override no se pisa.
 */
export function resolveDenominacionComercial(params: {
  override?: string | null;
  apodoSincronizado?: string | null;
}): string {
  const override = params.override?.trim() || "";
  if (override) return override;
  return params.apodoSincronizado?.trim() || "";
}

/**
 * Persiste override solo si el usuario escribió algo distinto del apodo sync.
 * Si coincide con el sync (o está vacío), se limpia el override.
 */
export function overrideDenominacionParaPersistir(params: {
  valorFormulario: string;
  apodoSincronizado: string;
}): string | null {
  const valor = params.valorFormulario.trim();
  if (!valor) return null;
  const apodo = params.apodoSincronizado.trim();
  if (valor === apodo) return null;
  return valor;
}
