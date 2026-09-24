const LOOKER_REPORTING_UUID =
  /(?:reporting|u\/0\/reporting)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

const ANY_UUID =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function normalizeEmbedUrl(raw: string): string {
  const url = raw.trim();
  if (!url) {
    throw new Error("La URL del reporte es obligatoria.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Ingresa una URL válida (https://…).");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("La URL del reporte debe empezar con http o https.");
  }

  return url;
}

export function extractReporteIdFromEmbedUrl(embedUrl: string): string | null {
  const reporting = embedUrl.match(LOOKER_REPORTING_UUID);
  if (reporting?.[1]) return reporting[1].toLowerCase();

  const anyUuid = embedUrl.match(ANY_UUID);
  return anyUuid?.[0]?.toLowerCase() ?? null;
}

export function resolveReporteIdFromEmbedUrl(
  embedUrl: string,
  generateId: () => string = () => crypto.randomUUID(),
): string {
  return extractReporteIdFromEmbedUrl(embedUrl) ?? generateId();
}
