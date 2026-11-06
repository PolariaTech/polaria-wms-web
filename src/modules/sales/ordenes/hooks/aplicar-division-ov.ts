"use client";
import { useCallback } from "react";
import { dividirOrdenVenta } from "../services/dividir-ov.client";
import type { DivisionReagrupacionApi } from "../services/reagrupar-ot.client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { quitarOtsDelFormulario } from "../utils/ot/quitar-ots-del-formulario";
import { construirEstadoBaseApi } from "../utils/ot/reagrupar-ordenes-trabajo";
import { parseCantidadReagrupacion } from "../utils/pedido/orden-venta-create-helpers";

/**
 * REQ-262 / REQ-273: parte la orden de venta por orden de compra.
 *
 * Orden de los pasos: primero el servidor crea las órdenes de venta nuevas y deja en la
 * actual las demás; solo si responde bien, el formulario quita las tareas que se fueron
 * y guarda el avance. Así un guardado posterior no vuelve a juntar lo que ya se separó.
 * Si el servidor falla, el formulario queda como estaba y el error sube al modal.
 */
export function useAplicarDivisionOv(estado: OrdenVentaFormEstado) {
  const {
    editingId,
    lineas,
    syncActiveOtFromForm,
    applyOrdenesTrabajo,
    setLineas,
    setFormOtPage,
    setReagruparOpen,
    setError,
    pendingDraftSaveAfterReorgRef,
    showToast,
  } = estado;

  const handleDividirOrden = useCallback(
    async (division: DivisionReagrupacionApi) => {
      const resultado = await dividirOrdenVenta({
        idOrdenVenta: editingId,
        criterio: division.criterio,
        valoresSalen: division.valoresSalen,
      });

      const hijas = syncActiveOtFromForm();
      const { indice } = construirEstadoBaseApi(
        hijas,
        lineas,
        parseCantidadReagrupacion,
      );
      const quedan = quitarOtsDelFormulario({
        hijas,
        lineas,
        otIdsQueSalen: division.otIdsQueSalen,
        indice,
      });

      applyOrdenesTrabajo(quedan.hijas);
      setLineas(quedan.lineas);
      setFormOtPage(0);
      setReagruparOpen(false);
      setError(null);
      pendingDraftSaveAfterReorgRef.current = true;

      const folios = resultado.ordenesNuevas
        .map((orden) => orden.codigo)
        .filter((codigo) => codigo.length > 0);
      showToast({
        title: "Orden de venta dividida",
        content:
          folios.length > 0
            ? `Se crearon ${folios.join(", ")}. Guardando el avance de esta orden…`
            : "Se crearon las órdenes nuevas. Guardando el avance de esta orden…",
        variant: "success",
        durationMs: 6000,
      });
    },
    [
      applyOrdenesTrabajo,
      editingId,
      lineas,
      pendingDraftSaveAfterReorgRef,
      setError,
      setFormOtPage,
      setLineas,
      setReagruparOpen,
      showToast,
      syncActiveOtFromForm,
    ],
  );

  return { handleDividirOrden };
}
