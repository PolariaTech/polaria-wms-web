import type { CamionTipo } from "../constants/camion-types";

/**
 * Tipos de vehículo + rango térmico sugerido.
 * El slider del formulario permite afinar entre TEMP_SLIDER_MIN y TEMP_SLIDER_MAX.
 */
export interface CamionTipoCatalogItem {
  value: CamionTipo;
  label: string;
  rangoTipico: string;
  /** Valores por defecto al elegir el tipo (slider). */
  tempMinDefault: number;
  tempMaxDefault: number;
  descripcion: string;
}

export const TEMP_SLIDER_MIN = -50;
export const TEMP_SLIDER_MAX = 200;

/** Presets rápidos de temperatura de operación (°C). */
export const CAMION_TEMP_PRESETS = [
  { id: "congelacion", label: "Congelación", celsius: -18 },
  { id: "refrigerado", label: "Refrigerado", celsius: 4 },
  { id: "fresco", label: "Fresco", celsius: 12 },
  { id: "ambiente", label: "Ambiente", celsius: 22 },
  { id: "templado", label: "Templado", celsius: 60 },
] as const;

export const CAMION_TIPO_CATALOG: readonly CamionTipoCatalogItem[] = [
  {
    value: "refrigerado",
    label: "Refrigerado",
    rangoTipico: "-25 °C a 15 °C",
    tempMinDefault: -25,
    tempMaxDefault: 15,
    descripcion: "Caja frigorífica con equipo de frío (cadena de frío).",
  },
  {
    value: "isotermico",
    label: "Isotérmico",
    rangoTipico: "0 °C a 25 °C",
    tempMinDefault: 0,
    tempMaxDefault: 25,
    descripcion: "Aísla sin equipo activo; mantiene temperatura corta distancia.",
  },
  {
    value: "seco",
    label: "Seco",
    rangoTipico: "Ambiente",
    tempMinDefault: 15,
    tempMaxDefault: 35,
    descripcion: "Carga seca / mercadería no refrigerada.",
  },
] as const;

export function getCamionTipoCatalogItem(
  tipo: CamionTipo | string,
): CamionTipoCatalogItem | undefined {
  return CAMION_TIPO_CATALOG.find((item) => item.value === tipo);
}

export function formatRangoTemperatura(
  tempMin: number,
  tempMax: number,
): string {
  if (tempMin === tempMax) return `${tempMin} °C`;
  const low = Math.min(tempMin, tempMax);
  const high = Math.max(tempMin, tempMax);
  return `${low} °C a ${high} °C`;
}

export function clampTemp(value: number): number {
  return Math.min(TEMP_SLIDER_MAX, Math.max(TEMP_SLIDER_MIN, Math.round(value)));
}
