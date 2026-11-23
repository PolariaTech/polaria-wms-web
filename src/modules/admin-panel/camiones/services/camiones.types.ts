import type { CamionTipo } from "../constants/camion-types";

export interface CamionListRow {
  idCamion: string;
  codigo: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  tipo: CamionTipo | string;
  capacidadKg: number | null;
  capacidadM3: number | null;
  capacidadPallets: number | null;
  rangoTemperatura: string | null;
  disponible: boolean;
  estaActivo: boolean;
  createdAt: string;
}

export interface CamionDbRow {
  id_camion: string;
  codigo: string | null;
  placa: string;
  marca: string | null;
  modelo: string | null;
  capacidad_kg: string | number | null;
  capacidad_m3: string | number | null;
  capacidad_pallets: number | null;
  tipo: CamionTipo | string;
  rango_temperatura: string | null;
  disponible: boolean;
  esta_activo?: boolean | null;
  created_at: string;
}

export interface ListCamionesParams {
  codigoCuenta: string;
  limit?: number;
  /** true (default) solo activos; false incluye deshabilitados (tablas admin). */
  soloActivos?: boolean;
}

export interface CreateCamionInput {
  codigoCuenta: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  capacidadKg?: number | null;
  capacidadM3?: number | null;
  capacidadPallets?: number | null;
  tipo: CamionTipo;
  rangoTemperatura?: string | null;
}

export interface UpdateCamionInput {
  codigoCuenta: string;
  idCamion: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  capacidadKg?: number | null;
  capacidadM3?: number | null;
  capacidadPallets?: number | null;
  tipo: CamionTipo;
  rangoTemperatura?: string | null;
  disponible?: boolean;
}

export interface DeactivateCamionParams {
  codigoCuenta: string;
  idCamion: string;
}

export const CAMION_LIST_COLUMNS =
  "id_camion,codigo,placa,marca,modelo,capacidad_kg,capacidad_m3,capacidad_pallets,tipo,rango_temperatura,disponible,esta_activo,created_at";