"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { formatDateTime } from "@/components/shared/utils/formatters";
import { useCenterActiveTab } from "@/hooks/shared/useCenterActiveTab";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import {
  puedeAccionesAlmacenOrdenVenta,
  puedeBorrarOrdenVenta,
  puedeEditarOrdenVentaDesdeLista,
} from "../../../shared/constants/sales-status";
import { formatCompradorOrdenVenta } from "../../utils/display/orden-venta-display";
import { resolveOrdenCompraLimpia } from "../../utils/pedido/normalize-numero-pedido";
import { isCypherNavStageActive } from "./cypher-stages";
import { useCypherDrawerResize } from "./cypher-drawer-resize";
import { useCypherDrawerPanelMount } from "./cypher-drawer-panel-mount";
import { useCypherDrawerOrdenLoad } from "./cypher-drawer-orden-load";
import { useCypherDrawerHijasOt } from "./cypher-drawer-hijas-ot";
import { useCypherDrawerLog } from "./cypher-drawer-log";
import { useCypherDrawerOrigenAdjuntos } from "./cypher-drawer-origen-adjuntos";
import { useCypherDrawerScrollSpy } from "./cypher-drawer-scroll-spy";
import { useCypherDrawerEstado } from "./cypher-drawer-estado";
import { useCypherDrawerStagesNav } from "./cypher-drawer-stages-nav";
import type { OrdenVentaCypherDrawerProps } from "./cypher-drawer-props";

export function useOrdenVentaCypherDrawerContent({
  idOrdenVenta,
  codigoCuenta,
  row,
  inspect = false,
  onClose,
  onFotos,
  onBorrar,
  companionWithEdit = false,
  companionOtPicker = null,
  companionIdComprador = null,
  onEstadoCambiado,
  onReagruparDesdeLista,
}: OrdenVentaCypherDrawerProps) {
  const titleId = useId();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stageNavRef = useRef<HTMLElement | null>(null);
  const open = Boolean(idOrdenVenta && codigoCuenta);
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);

  const [confirmBorrarOpen, setConfirmBorrarOpen] = useState(false);
  const [borrarError, setBorrarError] = useState<string | null>(null);
  const [logNonce, setLogNonce] = useState(0);
  const bumpLogNonce = useCallback(() => setLogNonce((v) => v + 1), []);

  const {
    cypherWidthMode,
    isResizingWidth,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
  } = useCypherDrawerResize();
  const { panelMounted, panelEntered } = useCypherDrawerPanelMount(open);

  const resetEstadoUiRef = useRef<() => void>(() => {});

  const resetOnOrdenChange = useCallback(() => {
    setConfirmBorrarOpen(false);
    setBorrarError(null);
    resetEstadoUiRef.current?.();
  }, []);

  const {
    orden,
    setOrden,
    isLoading,
    error,
    activeStage,
    setActiveStage,
    openStages,
    setOpenStages,
  } = useCypherDrawerOrdenLoad({
    idOrdenVenta,
    codigoCuenta,
    inspect,
    onResetUi: resetOnOrdenChange,
  });

  useEffect(() => {
    if (!open) {
      setConfirmBorrarOpen(false);
      setBorrarError(null);
    }
  }, [open]);

  const { hijasFromOrden, activeOtPicker, idOrdenTrabajoBitacora } = useCypherDrawerHijasOt({
    orden,
    companionOtPicker,
    onReagruparDesdeLista,
  });

  const { logEntries, logLoading } = useCypherDrawerLog({
    idOrdenVenta,
    codigoCuenta,
    idOrdenTrabajoBitacora,
    orden,
    row,
    logNonce,
  });

  const {
    cuerpoCompleto,
    cuerpoMensaje,
    correoChrome,
    origenAdjuntosStored,
    emlInnerAdjuntos,
    emlInnerLoading,
    origenAdjuntos,
    origenNombres,
  } = useCypherDrawerOrigenAdjuntos(orden);

  const {
    estado,
    estadosSuperiores,
    estadoCambiando,
    estadoPendiente,
    setEstadoPendiente,
    cambioEstadoError,
    setCambioEstadoError,
    cambiarEstado,
    resetEstadoUi,
  } = useCypherDrawerEstado({
    idOrdenVenta,
    codigoCuenta,
    row,
    orden,
    setOrden,
    onEstadoCambiado,
    bumpLogNonce,
  });

  resetEstadoUiRef.current = resetEstadoUi;

  const { scrollToStage, toggleAccordionStage } = useCypherDrawerStagesNav({
    setOpenStages,
    setActiveStage,
  });

  useCypherDrawerScrollSpy({
    open,
    isLoading,
    error,
    orden,
    scrollRef,
    setActiveStage,
  });

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  useCenterActiveTab(
    stageNavRef,
    isCypherNavStageActive("cambio-estado", activeStage) ? "cambio-estado" : activeStage,
    open,
  );

  const codigo = orden?.codigo ?? row?.venta ?? "OV";
  const comprador =
    (orden ? formatCompradorOrdenVenta(orden) : null) || row?.comprador || "—";
  const occRaw = row?.occ || orden?.orden_compra_hotel?.trim() || "";
  const occ = resolveOrdenCompraLimpia(occRaw, orden?.origen_texto ?? "") || "—";
  const recibida = formatDateTime(
    orden?.created_at || orden?.fecha_pedido || row?.fecha || "",
    zonaHoraria,
  );

  const lineas = orden?.lineas ?? [];

  const puedeEditar =
    !inspect && row
      ? companionWithEdit || puedeEditarOrdenVentaDesdeLista(row.estado)
      : false;
  const puedeAlmacen = !inspect && row ? puedeAccionesAlmacenOrdenVenta(row.estado) : false;
  const puedeBorrar = !inspect && row && onBorrar ? puedeBorrarOrdenVenta(row.estado) : false;
  const bloqueadoHastaConfirmar = "Disponible cuando la orden esté confirmada";

  return {
    titleId,
    scrollRef,
    stageNavRef,
    orden,
    codigoCuenta,
    companionIdComprador,
    open,
    zonaHoraria,
    confirmBorrarOpen,
    setConfirmBorrarOpen,
    borrarError,
    setBorrarError,
    cypherWidthMode,
    isResizingWidth,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    panelMounted,
    panelEntered,
    isLoading,
    error,
    activeStage,
    openStages,
    scrollToStage,
    toggleAccordionStage,
    hijasFromOrden,
    activeOtPicker,
    idOrdenTrabajoBitacora,
    logEntries,
    logLoading,
    cuerpoCompleto,
    cuerpoMensaje,
    correoChrome,
    origenAdjuntosStored,
    emlInnerAdjuntos,
    emlInnerLoading,
    origenAdjuntos,
    origenNombres,
    estado,
    estadosSuperiores,
    estadoCambiando,
    estadoPendiente,
    setEstadoPendiente,
    cambioEstadoError,
    setCambioEstadoError,
    cambiarEstado,
    codigo,
    comprador,
    occ,
    recibida,
    lineas,
    puedeEditar,
    puedeAlmacen,
    puedeBorrar,
    bloqueadoHastaConfirmar,
    onFotos,
    companionWithEdit,
    onClose,
    inspect,
    row,
  };
}
