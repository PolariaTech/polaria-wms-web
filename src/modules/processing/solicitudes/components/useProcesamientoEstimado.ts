import { useMemo } from "react";
import {
  PROCESAMIENTO_RELACION_PRIMARIO_BASE,
  buildProcesamientoDesgloseEstimado,
  estimadoSecundarioAplicarPerdidaPct,
  maxCantidadProcesamientoDesdeStock,
  unidadesSecundarioPorRegla,
} from "../../shared/constants/procesamiento-conversion";
import type { ProductoProcesamientoOption } from "../../shared/types/processing.types";
import { parsePositiveNumber } from "./orden-procesamiento-create-modal.helpers";

interface UseProcesamientoEstimadoParams {
  secundarioSeleccionado: ProductoProcesamientoOption | null;
  conversionUnidades: string;
  cantidadElegida: number;
  stockKg: number | null;
}

export function useProcesamientoEstimado({
  secundarioSeleccionado,
  conversionUnidades,
  cantidadElegida,
  stockKg,
}: UseProcesamientoEstimadoParams) {
  const conversionValue = parsePositiveNumber(conversionUnidades);

  const maxCantidad = useMemo(
    () => maxCantidadProcesamientoDesdeStock(stockKg ?? 0),
    [stockKg],
  );

  const perdidaPctDelCatalogo = secundarioSeleccionado?.mermaPct ?? 0;

  const estimadoTeorico = useMemo(() => {
    if (!secundarioSeleccionado || !conversionValue) return null;
    return unidadesSecundarioPorRegla(
      cantidadElegida,
      PROCESAMIENTO_RELACION_PRIMARIO_BASE,
      conversionValue,
    );
  }, [cantidadElegida, conversionValue, secundarioSeleccionado]);

  const estimadoUnidades = useMemo(() => {
    return estimadoSecundarioAplicarPerdidaPct(
      estimadoTeorico,
      perdidaPctDelCatalogo,
    );
  }, [estimadoTeorico, perdidaPctDelCatalogo]);

  const desgloseEstimado = useMemo(() => {
    if (estimadoUnidades === null) return null;
    return buildProcesamientoDesgloseEstimado(
      estimadoUnidades,
      estimadoTeorico,
      cantidadElegida,
    );
  }, [cantidadElegida, estimadoTeorico, estimadoUnidades]);

  return {
    conversionValue,
    maxCantidad,
    perdidaPctDelCatalogo,
    desgloseEstimado,
  };
}
