import {
  PROCESAMIENTO_RELACION_PRIMARIO_BASE,
  estimadoSecundarioAplicarPerdidaPct,
  unidadesSecundarioPorRegla,
} from "../../shared/constants/procesamiento-conversion";

interface ValidateOrdenProcesamientoParams {
  codigoCuenta: string | null;
  idBodega: string;
  idSolicitante: string;
  insumoValido: boolean;
  idSecundario: string;
  conversionValue: number | null;
  cantidadElegida: number;
  maxCantidad: number;
  perdidaPctDelCatalogo: number;
}

export type ValidateOrdenProcesamientoResult =
  | { ok: false; error: string }
  | { ok: true; codigoCuenta: string; cantidadValue: number; conversionValue: number; est: number };

export function validateOrdenProcesamientoSubmit({
  codigoCuenta,
  idBodega,
  idSolicitante,
  insumoValido,
  idSecundario,
  conversionValue,
  cantidadElegida,
  maxCantidad,
  perdidaPctDelCatalogo,
}: ValidateOrdenProcesamientoParams): ValidateOrdenProcesamientoResult {
  if (!codigoCuenta || !idBodega) {
    return { ok: false, error: "Selecciona una bodega interna (mapa) válida." };
  }

  if (!idSolicitante) {
    return { ok: false, error: "No se encontró el usuario solicitante." };
  }

  if (!insumoValido || !idSecundario) {
    return { ok: false, error: "Completa insumo y resultado válidos." };
  }

  if (!conversionValue) {
    return {
      ok: false,
      error: "Indicá cuántas unidades de secundario obtenés con 1 kg de primario.",
    };
  }

  const cantidadValue = Math.round(cantidadElegida);
  if (!Number.isFinite(cantidadValue) || cantidadValue <= 0) {
    return { ok: false, error: "Elegí una cantidad válida en primario." };
  }

  if (cantidadValue > maxCantidad) {
    return {
      ok: false,
      error: "La cantidad supera el stock disponible en bodega para este primario.",
    };
  }

  const estTeo = unidadesSecundarioPorRegla(
    cantidadValue,
    PROCESAMIENTO_RELACION_PRIMARIO_BASE,
    conversionValue,
  );
  if (estTeo === null) {
    return {
      ok: false,
      error: "No se pudo calcular el estimado del secundario. Revisá la conversión.",
    };
  }

  const est = estimadoSecundarioAplicarPerdidaPct(estTeo, perdidaPctDelCatalogo);
  if (est === null) {
    return {
      ok: false,
      error: "No se pudo aplicar la pérdida al estimado. Revisá los valores.",
    };
  }

  return { ok: true, codigoCuenta, cantidadValue, conversionValue, est };
}
