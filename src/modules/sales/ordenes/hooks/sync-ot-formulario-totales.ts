"use client";

import { useMemo } from "react";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import { lineAmounts } from "../utils/pedido/orden-venta-create-helpers";
import { hasOtPagerRequiredBlocking } from "../utils/ot/ot-pager-required";
import { todayIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { useRevisionPendienteOv } from "./aplicar-correccion-correo-ov";

export function useTotalesVentaOv(estado: OrdenVentaFormEstado) {
  const {
    lineasConIndice,
    paginarPorOt,
    step,
    idComprador,
    exigeOc,
    ordenCompraHotel,
    idBodegaDestino,
    fechaEntrega,
    ventanaDesde,
    ventanaHasta,
    isEditing,
    editingEstado,
    ordenesTrabajoForm,
    lineas,
    isLoading,
    isSaving,
    hasProductos,
    hasCatalogPending,
    formScrollRef,
    revisionFocusRequestRef,
    formOtSafePage,
  } = estado;

  const lineasParaTotales = useMemo(
    () => lineasConIndice.map(({ linea }: { linea: LineaVentaForm }) => linea),
    [lineasConIndice],
  );

  const otPagerNextBlocked = useMemo(() => {
    if (!paginarPorOt || step !== "form") return false;
    return hasOtPagerRequiredBlocking({
      idComprador,
      exigeOc,
      ordenCompraHotel,
      idBodegaDestino,
      fechaEntrega,
      todayIso: todayIsoDate(),
      ventanaDesde,
      ventanaHasta,
      lineasPagina: lineasConIndice.map(({ linea }: { linea: LineaVentaForm }) => ({
        cantidadInput: linea.cantidadInput,
        precioInput: linea.precioInput,
      })),
    });
  }, [
    exigeOc,
    fechaEntrega,
    idBodegaDestino,
    idComprador,
    lineasConIndice,
    ordenCompraHotel,
    paginarPorOt,
    step,
    ventanaDesde,
    ventanaHasta,
  ]);

  const esPorConfirmar =
    !isEditing ||
    editingEstado == null ||
    normalizeEstadoOrdenVenta(editingEstado) === "por_confirmar";

  const {
    revisionPendiente,
    confirmBloqueoReason,
    confirmSubmitDisabled,
    focusRevisionPendiente,
  } = useRevisionPendienteOv({
    step,
    esPorConfirmar,
    idComprador,
    exigeOc,
    ordenCompraHotel,
    fechaEntrega,
    ventanaDesde,
    ventanaHasta,
    ordenesTrabajoForm,
    lineas,
    isLoading,
    isSaving,
    hasProductos,
    hasCatalogPending,
    formScrollRef,
    revisionFocusRequestRef,
    paginarPorOt,
    formOtSafePage,
    lineasConIndice,
  } as OrdenVentaFormEstado);

  const subtotalVenta = useMemo(
    () =>
      lineasParaTotales.reduce(
        (sum: number, linea) => sum + lineAmounts(linea).bruto,
        0,
      ),
    [lineasParaTotales],
  );

  const ivaVenta = useMemo(
    () =>
      lineasParaTotales.reduce(
        (sum: number, linea) => sum + lineAmounts(linea).iva,
        0,
      ),
    [lineasParaTotales],
  );

  const totalVenta = useMemo(
    () => Math.max(0, subtotalVenta + ivaVenta),
    [ivaVenta, subtotalVenta],
  );

  const mostrarTotalOv =
    ordenesTrabajoForm.length > 1 &&
    lineas.some((linea: { otId?: string }) => Boolean(linea.otId));

  const totalOvCompleta = useMemo(() => {
    if (!mostrarTotalOv) return 0;
    return lineas.reduce((sum: number, linea) => {
      const importesLinea = lineAmounts(linea);
      return sum + Math.max(0, importesLinea.bruto + importesLinea.iva);
    }, 0);
  }, [lineas, mostrarTotalOv]);

  return {
    lineasParaTotales,
    otPagerNextBlocked,
    esPorConfirmar,
    revisionPendiente,
    confirmBloqueoReason,
    confirmSubmitDisabled,
    focusRevisionPendiente,
    subtotalVenta,
    ivaVenta,
    totalVenta,
    mostrarTotalOv,
    totalOvCompleta,
  };
}
