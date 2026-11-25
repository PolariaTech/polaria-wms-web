import {
  getCamionTipoCatalogItem,
  parseRangoTemperatura,
} from "../catalog/camion-tipo-temperatura";
import { matchCamionCatalogByNombre } from "../catalog/camion-vehiculos.catalog";
import {
  CAMION_TIPO_OPTIONS,
  type CamionTipo,
} from "../constants/camion-types";
import type { CamionListRow } from "../services/camiones.service";

export type CamionPickerKind = "marca" | "modelo" | "tipo" | null;

export function parseOptionalNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveCamionTipo(tipo: string): CamionTipo {
  const match = CAMION_TIPO_OPTIONS.find((item) => item.value === tipo);
  return match?.value ?? "refrigerado";
}

function optionalNumberToText(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

/** Valores iniciales del formulario de edición a partir de la fila de camión. */
export function buildCamionEditFormValues(camion: CamionListRow) {
  const tipo = resolveCamionTipo(String(camion.tipo));
  const tipoCatalog = getCamionTipoCatalogItem(tipo);
  const parsedRango = parseRangoTemperatura(camion.rangoTemperatura);
  const matched = matchCamionCatalogByNombre(camion.marca, camion.modelo);

  return {
    placa: camion.placa,
    marcaId: matched.marcaId,
    marca: camion.marca ?? "",
    modeloId: matched.modeloId,
    modelo: camion.modelo ?? "",
    capacidadKg: optionalNumberToText(camion.capacidadKg),
    capacidadM3: optionalNumberToText(camion.capacidadM3),
    capacidadPallets: optionalNumberToText(camion.capacidadPallets),
    tipo,
    tempMin: parsedRango?.tempMin ?? tipoCatalog?.tempMinDefault ?? -25,
    tempMax: parsedRango?.tempMax ?? tipoCatalog?.tempMaxDefault ?? 15,
    disponible: camion.disponible,
  };
}
