/**
 * Origen canónico para el QR de captura-orden.
 * Nunca debe quedar un preview de Vercel (SSO) impreso en la hoja.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Hosts de preview / deployment protection de Vercel.
 * - `*-git-*` ramas preview
 * - `*-projects.vercel.app` (cuenta personal / team slug projects)
 * - `proyecto-hash-equipo.vercel.app` (deployment URL con id corto)
 */
export function isLikelyVercelPreviewHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host.endsWith(".vercel.app")) return false;

  const sub = host.slice(0, -".vercel.app".length);
  if (!sub) return false;
  if (sub.includes("-git-")) return true;
  if (sub.includes("-projects")) return true;

  // p.ej. polaria-wms-rjvsxq7sn-luiscantilloos → 3+ segmentos con hash alfanumérico
  const parts = sub.split("-");
  if (parts.length >= 3) {
    const hasHashLike = parts.some(
      (part) => /^[a-z0-9]{7,14}$/i.test(part) && !/^[a-z]+$/i.test(part),
    );
    if (hasHashLike) return true;
  }

  return false;
}

export function isLikelyVercelPreviewOrigin(origin: string): boolean {
  const raw = origin.trim();
  if (!raw) return false;
  try {
    return isLikelyVercelPreviewHost(new URL(raw).hostname);
  } catch {
    return false;
  }
}

/**
 * Prioridad:
 * 1) NEXT_PUBLIC_APP_URL (producción)
 * 2) window origin solo si NO es preview de Vercel (local / dominio fijo)
 */
export function resolveCapturaOrdenOrigin(params?: {
  configuredAppUrl?: string | null;
  windowOrigin?: string | null;
}): string {
  const configured = trimTrailingSlash(
    (params?.configuredAppUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim(),
  );
  if (configured) {
    if (isLikelyVercelPreviewOrigin(configured)) {
      return "";
    }
    return configured;
  }

  const windowOrigin = trimTrailingSlash(
    (
      params?.windowOrigin ??
      (typeof window !== "undefined" ? window.location.origin : "")
    ).trim(),
  );
  if (!windowOrigin) return "";
  if (isLikelyVercelPreviewOrigin(windowOrigin)) return "";
  return windowOrigin;
}
