"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";

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
  createEmptyOrdenTrabajoHija,
  flattenOrdenesTrabajoToOrigenCorreo,
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  isGarbageOcValue,
  resolveOrdenCompraLimpia,
  sanitizeOrigenCorreoNumeroPedido,
} from "../utils/pedido/normalize-numero-pedido";
import { lineAmounts } from "../utils/pedido/orden-venta-create-helpers";
import { hasOtPagerRequiredBlocking } from "../utils/ot/ot-pager-required";
import { todayIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { useRevisionPendienteOv } from "./aplicar-correccion-correo-ov";

export function useSyncOtFormulario(estado: OrdenVentaFormEstado) {
  const { setOrdenesTrabajoPreview, setOrigenCorreoDraft, setFormOtPage, addOtAlmacen, setError, addOtNumeroPedido, ordenCompraHotel, fechaEntrega, ordenesTrabajoForm, setAddOtOpen, setAddOtAlmacen, setAddOtNumeroPedido, setStep, confirmRemoveOtId, setLineas, seededOtIdsRef, setConfirmRemoveOtId, step, formOtPage, startMode, lineas, centroConsumo, contacto, telefono, correo, direccion, anden, ventanaDesde, ventanaHasta, observaciones, prioridad, setSuccessMessage } = estado;
  const applyOrdenesTrabajo = useCallback((next: OrdenTrabajoHija[]) => {
    setOrdenesTrabajoPreview(next);
    setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
    setFormOtPage((page) =>
      next.length === 0 ? 0 : Math.min(page, next.length - 1),
    );
  }, []);

  const handleAddOrdenTrabajo = useCallback(() => {
    const almacen = addOtAlmacen.trim();
    if (!almacen) {
      setError("Indica el centro de consumo de la nueva tarea.");
      return;
    }
    const nueva = createEmptyOrdenTrabajoHija({
      almacen,
      numeroPedido: addOtNumeroPedido.trim() || ordenCompraHotel.trim(),
      fecha: fechaEntrega.trim(),
    });
    const next = [...ordenesTrabajoForm, nueva];
    applyOrdenesTrabajo(next);
    setAddOtOpen(false);
    setAddOtAlmacen("");
    setAddOtNumeroPedido("");
    setError(null);
    const newIndex = next.findIndex((h) => h.id === nueva.id);
    setFormOtPage(newIndex >= 0 ? newIndex : next.length - 1);
    setStep("form");
  }, [
    addOtAlmacen,
    addOtNumeroPedido,
    applyOrdenesTrabajo,
    fechaEntrega,
    ordenCompraHotel,
    ordenesTrabajoForm,
  ]);

  const handleConfirmRemoveOrdenTrabajo = useCallback(() => {
    const otId = confirmRemoveOtId;
    if (!otId) return;
    const next = ordenesTrabajoForm.filter((hija) => hija.id !== otId);
    applyOrdenesTrabajo(next);
    setLineas((prev) => prev.filter((linea) => linea.otId !== otId));
    seededOtIdsRef.current.delete(otId);
    setConfirmRemoveOtId(null);
    setError(null);
    if (step === "pickOt") {
      if (next.length === 0) setStep("preview");
      else if (next.length === 1) setStep("form");
      setFormOtPage(0);
    }
  }, [applyOrdenesTrabajo, confirmRemoveOtId, ordenesTrabajoForm, step]);

  const previewHijas = ordenesTrabajoForm;

  const formOtSafePagePreview =
    previewHijas.length > 0
      ? Math.min(formOtPage, previewHijas.length - 1)
      : 0;

  const paginarPorOt =
    startMode === "docs" &&
    ordenesTrabajoForm.length > 1 &&
    lineas.some((linea) => Boolean(linea.otId));

  const formOtSafePage = paginarPorOt
    ? Math.min(formOtPage, ordenesTrabajoForm.length - 1)
    : 0;

  const hijaFormActiva = paginarPorOt
    ? (ordenesTrabajoForm[formOtSafePage] ?? null)
    : null;

  /** Escribe los campos del formulario en la OT activa (antes de guardar o cambiar de página). */
  const syncActiveOtFromForm = useCallback((): OrdenTrabajoHija[] => {
    // REQ-141: también con 1 OT, para que borrar notas sí limpie el origen.
    const targetHija =
      paginarPorOt && hijaFormActiva
        ? hijaFormActiva
        : !paginarPorOt && ordenesTrabajoForm.length === 1
          ? ordenesTrabajoForm[0]
          : null;
    if (!targetHija) return ordenesTrabajoForm;

    const almacen = centroConsumo.trim();
    const numeroPedido = ordenCompraHotel.trim();
    const fecha = fechaEntrega.trim();
    const responsableExterno = contacto.trim();
    const telefonoOt = telefono.trim();
    const correoOt = correo.trim();
    const direccionOt = direccion.trim();
    const andenOt = anden.trim();
    const ventanaDesdeOt = ventanaDesde.trim();
    const ventanaHastaOt = ventanaHasta.trim();
    const notasOt = observaciones.trim();
    const prioridadOt = prioridad.trim();

    return ordenesTrabajoForm.map((hija) => {
      // REQ-141 / REQ-112: notas y dirección son de la OV — propagar a todas las OT.
      if (hija.id !== targetHija.id) {
        return {
          ...hija,
          renglones: (
            hija.renglones.length > 0
              ? hija.renglones
              : [{ Producto: "", Cantidad: 0 }]
          ).map((row) => ({
            ...row,
            "Notas generales": notasOt,
            "Direccion entrega": direccionOt,
            Destino: direccionOt,
          })),
        };
      }
      const renglones = (
        hija.renglones.length > 0
          ? hija.renglones
          : [{ Producto: "", Cantidad: 0 }]
      ).map((row) => ({
        ...row,
        Almacen: almacen || row.Almacen,
        "Numero pedido":
          numeroPedido ||
          (isGarbageOcValue(row["Numero pedido"])
            ? ""
            : row["Numero pedido"] || ""),
        Fecha: fecha || row.Fecha,
        "Responsable externo":
          responsableExterno || row["Responsable externo"],
        "Telefono contacto": telefonoOt || row["Telefono contacto"],
        "Correo contacto": correoOt || row["Correo contacto"],
        "Direccion entrega": direccionOt,
        Destino: direccionOt,
        Anden: andenOt || row.Anden,
        "Ventana desde": ventanaDesdeOt || row["Ventana desde"],
        "Ventana hasta": ventanaHastaOt || row["Ventana hasta"],
        "Notas generales": notasOt,
        Prioridad: prioridadOt || row.Prioridad,
      }));
      const label =
        (numeroPedido && almacen
          ? `${numeroPedido} — ${almacen}`
          : almacen || numeroPedido) || hija.label;
      return {
        ...hija,
        almacen,
        numeroPedido,
        fecha,
        responsableExterno,
        label,
        renglones,
      };
    });
  }, [
    anden,
    centroConsumo,
    contacto,
    correo,
    direccion,
    fechaEntrega,
    hijaFormActiva,
    observaciones,
    ordenCompraHotel,
    ordenesTrabajoForm,
    paginarPorOt,
    prioridad,
    telefono,
    ventanaDesde,
    ventanaHasta,
  ]);

  const goToOtPage = useCallback(
    (nextPage: number) => {
      if (paginarPorOt && hijaFormActiva) {
        applyOrdenesTrabajo(syncActiveOtFromForm());
      }
      setFormOtPage(nextPage);
      setError(null);
      setSuccessMessage(null);
    },
    [
      applyOrdenesTrabajo,
      hijaFormActiva,
      paginarPorOt,
      syncActiveOtFromForm,
    ],
  );
  return { applyOrdenesTrabajo, handleAddOrdenTrabajo, handleConfirmRemoveOrdenTrabajo, previewHijas, formOtSafePagePreview, paginarPorOt, formOtSafePage, hijaFormActiva, syncActiveOtFromForm, goToOtPage };
}

export function useTotalesVentaOv(estado: OrdenVentaFormEstado) {
  const {
    lineasConIndice, paginarPorOt, step, idComprador, exigeOc, ordenCompraHotel,
    idBodegaDestino, fechaEntrega, ventanaDesde, ventanaHasta, isEditing, editingEstado,
    ordenesTrabajoForm, lineas, isLoading, isSaving, hasProductos, hasCatalogPending,
    formScrollRef, revisionFocusRequestRef, formOtSafePage, codigoVenta, setEditingCodigo,
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
    exigeOc, fechaEntrega, idBodegaDestino, idComprador, lineasConIndice,
    ordenCompraHotel, paginarPorOt, step, ventanaDesde, ventanaHasta,
  ]);
  const esPorConfirmar =
    !isEditing ||
    editingEstado == null ||
    normalizeEstadoOrdenVenta(editingEstado) === "por_confirmar";
  const { revisionPendiente, confirmBloqueoReason, confirmSubmitDisabled, focusRevisionPendiente } =
    useRevisionPendienteOv({
      step, esPorConfirmar, idComprador, exigeOc, ordenCompraHotel, fechaEntrega,
      ventanaDesde, ventanaHasta, ordenesTrabajoForm, lineas, isLoading, isSaving,
      hasProductos, hasCatalogPending, formScrollRef, revisionFocusRequestRef,
      paginarPorOt, formOtSafePage, lineasConIndice,
    } as OrdenVentaFormEstado);
  const subtotalVenta = useMemo(
    () => lineasParaTotales.reduce((sum: number, linea) => sum + lineAmounts(linea).bruto, 0),
    [lineasParaTotales],
  );
  const descuentosVenta = useMemo(
    () => lineasParaTotales.reduce((sum: number, linea) => sum + lineAmounts(linea).descuento, 0),
    [lineasParaTotales],
  );
  const ivaVenta = useMemo(
    () => lineasParaTotales.reduce((sum: number, linea) => sum + lineAmounts(linea).iva, 0),
    [lineasParaTotales],
  );
  const totalVenta = useMemo(
    () => Math.max(0, subtotalVenta - descuentosVenta + ivaVenta),
    [descuentosVenta, ivaVenta, subtotalVenta],
  );
  const mostrarTotalOv =
    ordenesTrabajoForm.length > 1 &&
    lineas.some((linea: { otId?: string }) => Boolean(linea.otId));
  const totalOvCompleta = useMemo(() => {
    if (!mostrarTotalOv) return 0;
    return lineas.reduce((sum: number, linea) => {
      const importesLinea = lineAmounts(linea);
      return sum + Math.max(0, importesLinea.bruto - importesLinea.descuento + importesLinea.iva);
    }, 0);
  }, [lineas, mostrarTotalOv]);
  return {
    lineasParaTotales, otPagerNextBlocked, esPorConfirmar, revisionPendiente,
    confirmBloqueoReason, confirmSubmitDisabled, focusRevisionPendiente,
    subtotalVenta, descuentosVenta, ivaVenta, totalVenta, mostrarTotalOv, totalOvCompleta,
  };
}
