import type { CamionDbRow, CamionListRow } from "./camiones.types";

export function parseDecimal(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapCamionRow(row: CamionDbRow): CamionListRow {
  return {
    idCamion: row.id_camion,
    codigo: row.codigo ?? "—",
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    tipo: row.tipo,
    capacidadKg: parseDecimal(row.capacidad_kg),
    capacidadM3: parseDecimal(row.capacidad_m3),
    capacidadPallets: row.capacidad_pallets,
    rangoTemperatura: row.rango_temperatura,
    disponible: row.disponible,
    estaActivo: row.esta_activo !== false,
    createdAt: row.created_at,
  };
}

export function formatCamionId(idCamion: string): string {
  return idCamion.slice(0, 8).toUpperCase();
}