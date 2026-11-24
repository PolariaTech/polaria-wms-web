"use client";

import { useCallback, useLayoutEffect, useMemo } from "react";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { todayIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import {
  findPrimeraRevisionPendiente,
  revisionFocusSelector,
  type RevisionPendiente,
} from "../utils/ot/por-confirmar-revision-alert";
import {
  isConfirmSubmitDisabled,
  resolveConfirmBloqueoReason,
} from "../utils/ot/confirm-bloqueo-ov";

export function useRevisionPendienteOv(estado: OrdenVentaFormEstado) {
  const {
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
  } = estado;

  const revisionPendiente = useMemo(() => {
    if (step !== "form" || !esPorConfirmar) return null;
    return findPrimeraRevisionPendiente({
      idComprador,
      exigeOc,
      ordenCompraHotel,
      fechaEntrega,
      todayIso: todayIsoDate(),
      ventanaDesde,
      ventanaHasta,
      hijas: ordenesTrabajoForm,
      lineas: lineas.map((linea) => ({
        otId: linea.otId,
        catalogPending: linea.catalogPending,
        idProducto: linea.idProducto,
        cantidadInput: linea.cantidadInput,
        precioInput: linea.precioInput,
        aliasCliente: linea.aliasCliente,
        nombre: linea.nombre,
      })),
    });
  }, [
    esPorConfirmar,
    exigeOc,
    fechaEntrega,
    idComprador,
    lineas,
    ordenCompraHotel,
    ordenesTrabajoForm,
    step,
    ventanaDesde,
    ventanaHasta,
  ]);

  /** REQ-195: motivo explícito cuando Confirmar está deshabilitado. */
  const confirmBloqueoReason = useMemo(
    () =>
      resolveConfirmBloqueoReason({
        step,
        isLoading,
        isSaving,
        hasProductos,
        lineasCount: lineas.length,
        idComprador,
        hasCatalogPending,
        esPorConfirmar,
        revisionMessage: revisionPendiente?.message ?? null,
      }),
    [
      esPorConfirmar,
      hasCatalogPending,
      hasProductos,
      idComprador,
      isLoading,
      isSaving,
      lineas.length,
      revisionPendiente?.message,
      step,
    ],
  );

  const confirmSubmitDisabled = isConfirmSubmitDisabled({
    step,
    isLoading,
    isSaving,
    hasProductos,
    lineasCount: lineas.length,
    hasCatalogPending,
    idComprador,
  });

  const focusRevisionPendiente = useCallback((pendiente: RevisionPendiente) => {
    const selector = revisionFocusSelector(pendiente);
    if (!selector) return;
    const root = formScrollRef.current ?? document;
    const el = (root as ParentNode).querySelector(selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => {
      el.focus({ preventScroll: true });
    }, 180);
  }, []);

  useLayoutEffect(() => {
    const pending = revisionFocusRequestRef.current;
    if (!pending || step !== "form") return;
    if (
      pending.otIndex != null &&
      paginarPorOt &&
      formOtSafePage !== pending.otIndex
    ) {
      return;
    }
    revisionFocusRequestRef.current = null;
    const timer = window.setTimeout(() => {
      focusRevisionPendiente(pending);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [
    focusRevisionPendiente,
    formOtSafePage,
    lineasConIndice,
    paginarPorOt,
    step,
  ]);

  return {
    revisionPendiente,
    confirmBloqueoReason,
    confirmSubmitDisabled,
    focusRevisionPendiente,
  };
}
