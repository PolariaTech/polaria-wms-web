"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

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
import {
  decidirAperturaReagruparAlCargar,
  reagruparAbiertoSegunCypher,
  reagruparModalAbierto,
} from "../utils/ot/reagrupacion-modal-estado";
import {
  isGarbageOcValue,
  resolveOrdenCompraLimpia,
  sanitizeOrigenCorreoNumeroPedido,
} from "../utils/pedido/normalize-numero-pedido";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  FECHA_ENTREGA_DEFAULT_WARNING,
  isFechaEntregaAtrasada,
  isFechaEntregaIsoValida,
  validatePedidoCabecera,
} from "../utils/pedido/pedido-form-validation";
import {
  mergeOrigenAdjuntosWithEmlParts,
  nombresOrigenAdjuntos,
  origenAdjuntosFromEmlParts,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../utils/origen/origen-adjuntos";
import { useLeerOcDesdeAdjuntos } from "../utils/pedido/aviso-direccion-ov";

export function useAplicarReagrupacionOv(estado: OrdenVentaFormEstado) {
  const { syncActiveOtFromForm, lineas, applyOrdenesTrabajo, setLineas, setFormOtPage, setReagruparAplicada, setReagruparOpen, setError, isEditing, pendingEmitId, pendingDraftSaveAfterReorgRef, showToast } = estado;
  /** Estado actual del formulario para pedir una propuesta de reagrupación (REQ-125). */
  const obtenerSolicitudReagrupacion = useCallback(() => {
    const hijas = syncActiveOtFromForm();
    if (hijas.length === 0) return null;
    const { estadoBase } = construirEstadoBaseApi(
      hijas,
      lineas,
      parseCantidadReagrupacion,
    );
    return { estadoBase, firma: firmaEstadoReagrupacion(hijas, lineas) };
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

export function useEfectosFormularioOt(estado: OrdenVentaFormEstado) {
  const { abrirReagruparAlCargar, open, isEditing, editingId, ordenCargadaId, editingEstado, ordenesTrabajoForm, setReagruparOpen, onReagruparAlCargarAtendido, cypherOpen, onCompanionIdCompradorChange, idComprador, step, startMode, hijaFormActiva, setCentroConsumo, setOrdenCompraHotel, setFechaEntrega, setContacto, contacto, setTelefono, setCorreo, setAnden, setVentanaDesde, setVentanaHasta, setPrioridad, setAutoFields, centroConsumo, ordenCompraHotel, fechaEntrega, telefono, correo, anden, ventanaDesde, ventanaHasta, setWarnFields, setMissingFields } = estado;
  // REQ-188: «Modificar con IA» pedido desde el «+» de Acciones: abrir el chat en
  // cuanto el formulario trae las OT (y solo si la OV todavía lo permite). Se decide solo
  // con el detalle de LA OV pedida: el formulario conserva el de la anterior al cerrarse.
  useEffect(() => {
    const decision = decidirAperturaReagruparAlCargar({
      pedida: abrirReagruparAlCargar,
      formularioAbierto: open,
      editando: isEditing,
      ordenCargada: Boolean(editingId) && ordenCargadaId === editingId,
      estadoOrdenVenta: editingEstado,
      cantidadOt: ordenesTrabajoForm.length,
    });
    if (decision === "ninguna" || decision === "esperar") return;
    if (decision === "abrir") setReagruparOpen(true);
    onReagruparAlCargarAtendido?.();
  }, [
    abrirReagruparAlCargar,
    editingEstado,
    editingId,
    isEditing,
    onReagruparAlCargarAtendido,
    open,
    ordenCargadaId,
    ordenesTrabajoForm.length,
  ]);

  // El chat vive con el Cypher: al cerrar éste (la X, o el formulario) el chat se cierra
  // con él, y al reabrirlo no debe reaparecer solo.
  useEffect(() => {
    setReagruparOpen((actual) => reagruparAbiertoSegunCypher(actual, cypherOpen));
  }, [cypherOpen]);

  // REQ-126: Cypher fiscal usa el cliente del formulario (no solo el guardado).
  useEffect(() => {
    if (!onCompanionIdCompradorChange) return;
    if (!open || !cypherOpen) {
      onCompanionIdCompradorChange(null);
      return;
    }
    onCompanionIdCompradorChange(idComprador.trim() || null);
    return () => {
      onCompanionIdCompradorChange(null);
    };
  }, [cypherOpen, idComprador, onCompanionIdCompradorChange, open]);

  useEffect(() => {
    if (step !== "form" || startMode !== "docs") return;

    const hija =
      hijaFormActiva ??
      (ordenesTrabajoForm.length === 1 ? ordenesTrabajoForm[0] : null);
    if (!hija) return;

    const first = hija.renglones[0];
    const almacen =
      hija.almacen?.trim() ||
      first?.Almacen?.trim() ||
      first?.["Numero almacen"]?.trim() ||
      "";
    if (almacen) {
      setCentroConsumo(almacen);
    }
    const numeroPedidoHija = hija.numeroPedido?.trim() || "";
    // No reinyectar basura OCR (ej. rAutorizado) al cambiar de OT.
    if (numeroPedidoHija && !isGarbageOcValue(numeroPedidoHija)) {
      setOrdenCompraHotel(numeroPedidoHija);
    }
    const fechaHija = toDateInputValue(hija.fecha);
    const fechaIso = isFechaEntregaIsoValida(fechaHija) ? fechaHija : "";
    if (fechaIso) {
      setFechaEntrega(fechaIso);
    }
    const contactoHija =
      hija.responsableExterno?.trim() ||
      first?.["Responsable externo"]?.trim() ||
      "";
    if (contactoHija) {
      setContacto(contactoHija);
    }
    const telefonoHija = first?.["Telefono contacto"]?.trim() || "";
    if (telefonoHija) setTelefono(telefonoHija);
    const correoHija = first?.["Correo contacto"]?.trim() || "";
    if (correoHija) setCorreo(correoHija);
    // REQ-112: dirección es de la OV — no reinyectar al cambiar de OT.
    const andenHija = first?.Anden?.trim() || "";
    if (andenHija) setAnden(andenHija);
    const ventanaDesdeHija = first?.["Ventana desde"]?.trim() || "";
    if (ventanaDesdeHija) setVentanaDesde(ventanaDesdeHija);
    const ventanaHastaHija = first?.["Ventana hasta"]?.trim() || "";
    if (ventanaHastaHija) setVentanaHasta(ventanaHastaHija);
    // REQ-141: no reinyectar Notas generales al cambiar de OT (son de la OV).
    const prioridadHija = first?.Prioridad?.trim() || "";
    if (prioridadHija) setPrioridad(prioridadHija);

    setAutoFields((prev) => {
      const next = new Set(prev);
      if (almacen) next.add("centroConsumo");
      if (hija.numeroPedido?.trim()) next.add("ordenCompraHotel");
      if (fechaIso) next.add("fechaEntrega");
      if (contactoHija) next.add("contacto");
      if (telefonoHija) next.add("telefono");
      if (correoHija) next.add("correo");
      if (andenHija) next.add("anden");
      if (ventanaDesdeHija) next.add("ventanaDesde");
      if (ventanaHastaHija) next.add("ventanaHasta");
      return next;
    });
    setWarnFields((prev) => {
      const next = new Set(prev);
      next.delete("centroConsumo");
      next.delete("ordenCompraHotel");
      next.delete("fechaEntrega");
      next.delete("contacto");
      next.delete("telefono");
      next.delete("correo");
      next.delete("anden");
      next.delete("ventanaDesde");
      next.delete("ventanaHasta");
      return next;
    });
    setMissingFields((prev) => {
      const next = new Set(prev);
      next.delete("centroConsumo");
      next.delete("ordenCompraHotel");
      next.delete("fechaEntrega");
      next.delete("contacto");
      next.delete("telefono");
      next.delete("correo");
      next.delete("anden");
      next.delete("ventanaDesde");
      next.delete("ventanaHasta");
      return next;
    });
  }, [
    hijaFormActiva,
    ordenesTrabajoForm,
    startMode,
    step,
  ]);
  return {  };
}

export function useCamposDeLaOtActiva(estado: OrdenVentaFormEstado) {
  const { origenAdjuntos, setEmlInnerAdjuntos, correo, step, open, ordenCompraHotel, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft } = estado;
  useEffect(() => {
    const eml = origenAdjuntos.find((item) => {
      const name = item.nombre.toLowerCase();
      const mime = (item.mime ?? "").toLowerCase();
      return (
        Boolean(item.path?.trim()) &&
        (name.endsWith(".eml") || mime.includes("message"))
      );
    });
    const emlPath = eml?.path?.trim() || "";
    if (!emlPath) {
      setEmlInnerAdjuntos([]);
      return;
    }

    let cancelled = false;
    void fetch(
      `/api/ov-adjuntos/eml-parts?path=${encodeURIComponent(emlPath)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron leer adjuntos del correo.");
        }
        const data = (await response.json()) as {
          parts?: Array<{
            index: number;
            nombre: string;
            mime: string;
            bytes: number;
          }>;
        };
        if (cancelled) return;
        setEmlInnerAdjuntos(
          origenAdjuntosFromEmlParts(emlPath, data.parts ?? []),
        );
      })
      .catch(() => {
        if (!cancelled) setEmlInnerAdjuntos([]);
      });

    return () => {
      cancelled = true;
    };
  }, [origenAdjuntos]);

  // Si OCC quedó vacía tras limpiar rAutorizado, recuperar REQUISICION # desde el .eml/PDFs.
  useLeerOcDesdeAdjuntos({
    step, open, ordenCompraHotel, origenAdjuntos, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft,
  } as OrdenVentaFormEstado);

  return {  };
}
