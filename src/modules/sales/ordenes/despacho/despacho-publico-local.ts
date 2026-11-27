/** Solo el API de loopback. Producción sigue escribiendo el estado por Nest. */
export function despachoLocalPuedeEscribirEstado(
  detalle: string,
  apiBaseUrl: string,
): boolean {
  const base = apiBaseUrl.trim();
  const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(base);
  if (!local) return false;
  const texto = detalle.toLowerCase();
  return (
    texto.includes("404") ||
    texto.includes("cannot post") ||
    texto.includes("econnrefused") ||
    texto.includes("fetch failed") ||
    texto.includes("internal_api_key no configurada")
  );
}
