/**
 * Zonas IANA disponibles por cuenta (REQ-054 / REQ-056).
 * Los instantes siguen en UTC en BD; esto solo define cómo se muestran.
 *
 * Fuente de verdad: `cuenta.zona_horaria`.
 * localStorage es caché de lectura rápida en el cliente tras cargar/guardar.
 */

export const CUENTA_ZONA_HORARIA_DEFAULT = "America/Cancun" as const;

export const CUENTA_ZONA_HORARIA_OPTIONS = [
  {
    id: "America/Cancun",
    label: "Cancún",
    shortLabel: "hora de Cancún",
    region: "México · Sureste",
    offsetLabel: "UTC−5",
  },
  {
    id: "America/Mexico_City",
    label: "Ciudad de México",
    shortLabel: "hora de CDMX",
    region: "México · Centro",
    offsetLabel: "UTC−6",
  },
  {
    id: "America/Bogota",
    label: "Bogotá",
    shortLabel: "hora de Bogotá",
    region: "Colombia",
    offsetLabel: "UTC−5",
  },
  {
    id: "America/Lima",
    label: "Lima",
    shortLabel: "hora de Lima",
    region: "Perú",
    offsetLabel: "UTC−5",
  },
  {
    id: "America/Argentina/Buenos_Aires",
    label: "Buenos Aires",
    shortLabel: "hora de Buenos Aires",
    region: "Argentina",
    offsetLabel: "UTC−3",
  },
  {
    id: "UTC",
    label: "UTC",
    shortLabel: "UTC",
    region: "Referencia mundial",
    offsetLabel: "UTC±0",
  },
] as const;

export type CuentaZonaHorariaId =
  (typeof CUENTA_ZONA_HORARIA_OPTIONS)[number]["id"];

const OPTION_IDS = new Set<string>(
  CUENTA_ZONA_HORARIA_OPTIONS.map((o) => o.id),
);

export function isCuentaZonaHorariaId(
  value: string,
): value is CuentaZonaHorariaId {
  return OPTION_IDS.has(value);
}

export function resolveCuentaZonaHorariaId(
  value: string | null | undefined,
): CuentaZonaHorariaId {
  const trimmed = value?.trim() ?? "";
  if (isCuentaZonaHorariaId(trimmed)) return trimmed;
  return CUENTA_ZONA_HORARIA_DEFAULT;
}

export function getCuentaZonaHorariaOption(id: CuentaZonaHorariaId) {
  return (
    CUENTA_ZONA_HORARIA_OPTIONS.find((o) => o.id === id) ??
    CUENTA_ZONA_HORARIA_OPTIONS[0]!
  );
}

const STORAGE_PREFIX = "polaria.cuenta.zona_horaria:";

export function storageKeyCuentaZonaHoraria(codigoCuenta: string): string {
  return `${STORAGE_PREFIX}${codigoCuenta.trim()}`;
}

/** Lee la zona configurada (localStorage) o el default Cancún. */
export function readCuentaZonaHoraria(
  codigoCuenta: string | null | undefined,
): CuentaZonaHorariaId {
  const codigo = codigoCuenta?.trim() ?? "";
  if (!codigo || typeof window === "undefined") {
    return CUENTA_ZONA_HORARIA_DEFAULT;
  }
  try {
    const raw = window.localStorage.getItem(
      storageKeyCuentaZonaHoraria(codigo),
    );
    return resolveCuentaZonaHorariaId(raw);
  } catch {
    return CUENTA_ZONA_HORARIA_DEFAULT;
  }
}

export function writeCuentaZonaHoraria(
  codigoCuenta: string,
  zona: CuentaZonaHorariaId,
): void {
  const codigo = codigoCuenta.trim();
  if (!codigo || typeof window === "undefined") return;
  window.localStorage.setItem(storageKeyCuentaZonaHoraria(codigo), zona);
}
