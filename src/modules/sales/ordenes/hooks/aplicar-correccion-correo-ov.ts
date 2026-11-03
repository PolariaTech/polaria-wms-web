"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  aplicarReagrupacion,
  construirEstadoBaseApi,
  crearSnapshotReagrupacion,
  describirReagrupacionParaBitacora,
  firmaEstadoReagrupacion,
  puedeReagruparOt,
  type PropuestaReagrupacionApi,
} from "../utils/ot/reagrupar-ordenes-trabajo";
import {
  describirCorreccionParaBitacora,
  origenCorreoDePropuesta,
  type PropuestaCorreccionCorreoApi,
} from "../utils/ot/aplicar-correccion-correo";
import { buildPedidoExtraidoFromOrigenCorreo } from "../utils/origen/pedido-from-origen-correo";
import {
  mapPedidoExtraidoToForm,
  type CampoDiscrepancia,
} from "../utils/pedido/map-pedido-extraido-to-form";
import {
  formatCapturaFecha,
  isAfterWarehouseCutoff,
  parseOrdenVentaCapturaObservaciones,
  stripSurtidoFotoQrFromNotas,
  todayIsoDate,
  tomorrowIsoDate,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { withNotasGeneralesOnHijas } from "../utils/ot/notas-generales-ot";
import {
  createEmptyOrdenTrabajoHija,
  flattenOrdenesTrabajoToOrigenCorreo,
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  applyProductoToLinea,
  collectSugerenciasLinea,
  fieldControlClass,
  formatBodegaDestinoOption,
  formatCompradorLabel,
  formatPrecioInput,
  lineaFormDesdeIa,
  lineAmounts,
  parseCantidadReagrupacion,
  resolveBodegaDestinoInicial,
  suggestFromCatalogo,
  sugerenciaToOption,
  toDateInputValue,
} from "../utils/pedido/orden-venta-create-helpers";

export function useAplicarCorreccionCorreoOv(e: Record<string, any>) {
  const { correo, syncActiveOtFromForm, lineas, origenTexto, observaciones, productos, centroConsumo, ventanaDesde, ventanaHasta, direccion, anden, contacto, telefono, aceptaSustituciones, requiereLote, registrarTemperatura, applyOrdenesTrabajo, setLineas, setFormOtPage, setReagruparAplicada, setReagruparOpen, setError, isEditing, pendingEmitId, pendingDraftSaveAfterReorgRef, showToast } = e;
  /**
   * REQ-187: aplica como BORRADOR la corrección propuesta tras releer el correo y los
   * archivos de la OV. Reemplaza las OT y las líneas del formulario con la misma
   * interpretación que al abrir una OV externa (renglones → líneas con producto de
   * catálogo); lo que no se reconoce queda marcado para elegir. No escribe en BD.
   */
  const handleAplicarCorreccionCorreo = useCallback(
    (propuesta: PropuestaCorreccionCorreoApi) => {
      const hijasActuales = syncActiveOtFromForm();
      const snapshot = crearSnapshotReagrupacion(hijasActuales, lineas);
      const filas = origenCorreoDePropuesta(propuesta);

      const pedido = buildPedidoExtraidoFromOrigenCorreo({
        origenCorreo: filas,
        origenTexto,
        notasAlmacen: observaciones,
      });
      // El servidor ya fijó la OC de cada documento: la clave de cada línea debe ser
      // exactamente la de su renglón para que caiga en su OT (pedido + almacén).
      pedido.lineas = pedido.lineas.map((linea: any, indice: any) => ({
        ...linea,
        numeroPedido: filas[indice]?.["Numero pedido"]?.toString().trim() || null,
      }));

      const mapped = mapPedidoExtraidoToForm({
        pedido,
        productos,
        ficha: {
          centroConsumo,
          ventanaDesde,
          ventanaHasta,
          direccion,
          anden,
          contacto,
          telefono,
          correo,
          aceptaSustituciones,
          requiereLote,
          registrarTemperatura,
          observaciones,
        },
        tomorrowIso: tomorrowIsoDate(),
        todayIso: todayIsoDate(),
      });

      // REQ-141: el origen no debe reinyectar notas que el usuario ya borró de la OV.
      const hijas = withNotasGeneralesOnHijas(
        groupOrigenCorreoToOrdenesTrabajo(filas),
        observaciones,
      );
      if (hijas.length === 0 || mapped.lineas.length === 0) {
        throw new Error("La corrección no trae renglones.");
      }

      applyOrdenesTrabajo(hijas);
      setLineas(mapped.lineas.map(lineaFormDesdeIa));
      setFormOtPage(0);
      setReagruparAplicada({
        snapshot,
        instruccion: "Corrección contra el correo",
        resumen: {
          antes: propuesta.resumen.otAntes,
          despues: propuesta.resumen.otDespues,
          nuevas: propuesta.diff.otNuevas.length,
          vacias: propuesta.diff.otEliminadas.length,
        },
        movimientos: [],
        otNuevas: [],
        correccion: {
          resumen: propuesta.resumen,
          documentos: propuesta.documentos,
        },
      });
      setReagruparOpen(false);
      setError(null);
      // REQ-195: persistir corrección en OV existente.
      if (isEditing || pendingEmitId) {
        pendingDraftSaveAfterReorgRef.current = true;
      }
      showToast({
        title: "Órdenes de trabajo corregidas con el correo",
        content:
          isEditing || pendingEmitId
            ? "Guardando el avance. Revisa productos marcados si quedan pendientes."
            : "El cambio quedó como borrador. Revisa los productos marcados, guarda el pedido para conservarlo o pulsa Deshacer.",
        variant: "success",
        durationMs: 6000,
      });
    },
    [
      aceptaSustituciones,
      anden,
      applyOrdenesTrabajo,
      centroConsumo,
      contacto,
      correo,
      direccion,
      isEditing,
      lineas,
      observaciones,
      origenTexto,
      pendingEmitId,
      productos,
      registrarTemperatura,
      requiereLote,
      showToast,
      syncActiveOtFromForm,
      telefono,
      ventanaDesde,
      ventanaHasta,
    ],
  );
  return { handleAplicarCorreccionCorreo };
}


import {
  findPrimeraRevisionPendiente,
  revisionFocusSelector,
  type RevisionPendiente,
} from "../utils/ot/por-confirmar-revision-alert";
import {
  isConfirmSubmitDisabled,
  resolveConfirmBloqueoReason,
} from "../utils/ot/confirm-bloqueo-ov";

export function useRevisionPendienteOv(e: Record<string, any>) {
  const { step, esPorConfirmar, idComprador, exigeOc, ordenCompraHotel, fechaEntrega, ventanaDesde, ventanaHasta, ordenesTrabajoForm, lineas, isLoading, isSaving, hasProductos, hasCatalogPending, formScrollRef, revisionFocusRequestRef, paginarPorOt, formOtSafePage, lineasConIndice } = e;
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
      lineas: lineas.map((linea: any) => ({
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
  return { revisionPendiente, confirmBloqueoReason, confirmSubmitDisabled, focusRevisionPendiente };
}

export function useDeshacerReagrupacionOv(e: Record<string, any>) {
  const { reagruparAplicada, applyOrdenesTrabajo, setLineas, setReagruparAplicada, setError } = e;
  const handleDeshacerReagrupacion = useCallback(() => {
    if (!reagruparAplicada) return;
    applyOrdenesTrabajo(reagruparAplicada.snapshot.hijas);
    setLineas(reagruparAplicada.snapshot.lineas);
    setReagruparAplicada(null);
    setError(null);
  }, [applyOrdenesTrabajo, reagruparAplicada]);
  return { handleDeshacerReagrupacion };
}
