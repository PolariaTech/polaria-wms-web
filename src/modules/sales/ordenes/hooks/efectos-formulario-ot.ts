"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

import { useEffect, useRef } from "react";
import {
  decidirAperturaReagruparAlCargar,
  reagruparAbiertoSegunCypher,
} from "../utils/ot/reagrupacion-modal-estado";
import { origenAdjuntosFromEmlParts } from "../utils/origen/origen-adjuntos";
import { useLeerOcDesdeAdjuntos } from "../utils/pedido/aviso-direccion-ov";
import { hidratarFormularioDesdeHija } from "./hidratar-formulario-desde-hija";

export function useEfectosFormularioOt(estado: OrdenVentaFormEstado) {
  const {
    abrirReagruparAlCargar,
    open,
    isEditing,
    editingId,
    ordenCargadaId,
    editingEstado,
    ordenesTrabajoForm,
    setReagruparOpen,
    onReagruparAlCargarAtendido,
    cypherOpen,
    onCompanionIdCompradorChange,
    idComprador,
    step,
    startMode,
    hijaFormActiva,
    setCentroConsumo,
    setOrdenCompraHotel,
    setReferenciaPedido,
    setFechaEntrega,
    setAnden,
    setVentanaDesde,
    setVentanaHasta,
    setPrioridad,
    setAutoFields,
    setWarnFields,
    setMissingFields,
  } = estado;
  const hijaActivaId =
    hijaFormActiva?.id ??
    (ordenesTrabajoForm.length === 1 ? ordenesTrabajoForm[0]?.id : undefined);
  const hijaFormActivaRef = useRef(hijaFormActiva);
  const ordenesTrabajoFormRef = useRef(ordenesTrabajoForm);
  useEffect(() => {
    hijaFormActivaRef.current = hijaFormActiva;
    ordenesTrabajoFormRef.current = ordenesTrabajoForm;
  }, [hijaFormActiva, ordenesTrabajoForm]);
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

  // REQ-374: solo al cambiar de OT (id), no en cada mutación de ordenesTrabajoForm.
  useEffect(() => {
    if (step !== "form" || startMode !== "docs") return;

    const hijaPager = hijaFormActivaRef.current;
    const hijasActuales = ordenesTrabajoFormRef.current;
    const hija =
      hijaPager ?? (hijasActuales.length === 1 ? hijasActuales[0] : null);
    if (!hija) return;

    // REQ-112 / REQ-141 / REQ-281: contacto / teléfono / correo / dirección / notas
    // son de la OV — no reinyectar (hidratar solo trae campos de OT).
    // REQ-311: sin pager no pisar centro editado; con pager sí fuerza la hija activa.
    hidratarFormularioDesdeHija(
      hija,
      {
        setCentroConsumo,
        setOrdenCompraHotel,
        setReferenciaPedido,
        setFechaEntrega,
        setAnden,
        setVentanaDesde,
        setVentanaHasta,
        setPrioridad,
        setAutoFields,
        setWarnFields,
        setMissingFields,
      },
      { forzarCamposOt: Boolean(hijaPager) },
    );
  }, [
    hijaActivaId,
    setAnden,
    setAutoFields,
    setCentroConsumo,
    setFechaEntrega,
    setMissingFields,
    setOrdenCompraHotel,
    setPrioridad,
    setReferenciaPedido,
    setVentanaDesde,
    setVentanaHasta,
    setWarnFields,
    startMode,
    step,
  ]);
  return {};
}

export function useCamposDeLaOtActiva(estado: OrdenVentaFormEstado) {
  const {
    origenAdjuntos,
    setEmlInnerAdjuntos,
    step,
    open,
    ordenCompraHotel,
    setOrdenCompraHotel,
    setOrdenesTrabajoPreview,
    setOrigenCorreoDraft,
  } = estado;
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
    step,
    open,
    ordenCompraHotel,
    origenAdjuntos,
    setOrdenCompraHotel,
    setOrdenesTrabajoPreview,
    setOrigenCorreoDraft,
  } as OrdenVentaFormEstado);

  return {};
}
