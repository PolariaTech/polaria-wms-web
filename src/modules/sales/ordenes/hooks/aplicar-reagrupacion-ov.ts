"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

import { useCallback } from "react";
import { conDiaYHorario } from "../utils/ot/estado-base-con-dia-y-horario";
import {
  aplicarReagrupacion,
  construirEstadoBaseApi,
  crearSnapshotReagrupacion,
  firmaEstadoReagrupacion,
  type PropuestaReagrupacionApi,
} from "../utils/ot/reagrupar-ordenes-trabajo";
import { parseCantidadReagrupacion } from "../utils/pedido/orden-venta-create-helpers";

export function useAplicarReagrupacionOv(estado: OrdenVentaFormEstado) {
  const {
    syncActiveOtFromForm,
    lineas,
    applyOrdenesTrabajo,
    setLineas,
    setFormOtPage,
    setReagruparAplicada,
    setReagruparOpen,
    setError,
    isEditing,
    pendingEmitId,
    pendingDraftSaveAfterReorgRef,
    showToast,
  } = estado;
  /** Estado actual del formulario para pedir una propuesta de reagrupación (REQ-125). */
  const obtenerSolicitudReagrupacion = useCallback(() => {
    const hijas = syncActiveOtFromForm();
    if (hijas.length === 0) return null;
    const { estadoBase } = construirEstadoBaseApi(
      hijas,
      lineas,
      parseCantidadReagrupacion,
    );
    return {
      estadoBase: conDiaYHorario(estadoBase, hijas),
      firma: firmaEstadoReagrupacion(hijas, lineas),
    };
  }, [lineas, syncActiveOtFromForm]);

  /**
   * Aplica la propuesta como BORRADOR: mueve renglones y reasigna las líneas a la
   * vez, sin escribir en BD. Lanza si la propuesta no respeta las OT originales.
   */
  const handleAplicarReagrupacion = useCallback(
    (datos: { propuesta: PropuestaReagrupacionApi; instruccion: string }) => {
      const hijas = syncActiveOtFromForm();
      // Los ids de renglón son deterministas: se reconstruye el índice con el estado actual.
      const { indice } = construirEstadoBaseApi(
        hijas,
        lineas,
        parseCantidadReagrupacion,
      );
      const snapshot = crearSnapshotReagrupacion(hijas, lineas);
      const resultado = aplicarReagrupacion({
        hijas,
        lineas,
        propuesta: datos.propuesta,
        indice,
      });

      applyOrdenesTrabajo(resultado.hijas);
      setLineas(resultado.lineas);
      setFormOtPage(0);
      setReagruparAplicada({
        snapshot,
        instruccion: datos.instruccion,
        resumen: datos.propuesta.resumen,
        movimientos: resultado.movimientos,
        otNuevas: resultado.otNuevas,
      });
      setReagruparOpen(false);
      setError(null);
      // REQ-195: en OV existente, persistir el borrador al aplicar (no solo memoria).
      if (isEditing || pendingEmitId) {
        pendingDraftSaveAfterReorgRef.current = true;
      }
      showToast({
        title: "Órdenes de trabajo reorganizadas",
        content:
          isEditing || pendingEmitId
            ? "Guardando el avance para conservar la reorganización…"
            : "El cambio quedó como borrador. Guarda el pedido para conservarlo o pulsa Deshacer.",
        variant: "success",
        durationMs: 5000,
      });
    },
    [
      applyOrdenesTrabajo,
      isEditing,
      lineas,
      pendingEmitId,
      showToast,
      syncActiveOtFromForm,
    ],
  );
  return { obtenerSolicitudReagrupacion, handleAplicarReagrupacion };
}

export {
  useCamposDeLaOtActiva,
  useEfectosFormularioOt,
} from "./efectos-formulario-ot";
