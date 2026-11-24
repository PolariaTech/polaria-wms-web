import type { OrdenSurtidoCapturaPayload } from "../../surtido/orden-surtido.types";

export type CapturaApiRow = {
  idOrdenTrabajo?: string;
  payload?: OrdenSurtidoCapturaPayload;
  urlFoto?: string | null;
  updatedAt?: string;
};

export function campoCaptura(
  campos: Record<string, string> | undefined,
  ...keys: string[]
): string {
  if (!campos) return "";
  for (const key of keys) {
    const direct = campos[key]?.trim();
    if (direct) return direct;
  }
  const lower = Object.fromEntries(
    Object.entries(campos).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    const value = lower[key.toLowerCase()]?.trim();
    if (value) return value;
  }
  return "";
}

export function formatElapsedSince(iso: string | null | undefined, now: number): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const diffMs = Math.max(0, now - then);
  const totalMin = Math.floor(diffMs / 60_000);
  if (totalMin < 1) return "hace un momento";
  if (totalMin < 60) return `hace ${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 48) {
    return mins > 0 ? `hace ${hours} h ${mins} min` : `hace ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}