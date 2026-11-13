"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

import { useEffect } from "react";
import {
  decidirAperturaReagruparAlCargar,
  reagruparAbiertoSegunCypher,
} from "../utils/ot/reagrupacion-modal-estado";
import { origenAdjuntosFromEmlParts } from "../utils/origen/origen-adjuntos";
import { useLeerOcDesdeAdjuntos } from "../utils/pedido/aviso-direccion-ov";
import { cabeceraOtDesdeHija } from "./cabecera-ot-desde-hija";

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
    setFechaEntrega,
    setAnden,
    setVentanaDesde,
    setVentanaHasta,
    setPrioridad,
    setAutoFields,
    setWarnFields,
    setMissingFields,
  } = estado;
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

    // REQ-112 / REQ-141 / REQ-281: contacto / teléfono / correo / dirección / notas
    // son de la OV — no reinyectar (cabeceraOtDesdeHija solo trae campos de OT).
    const cab = cabeceraOtDesdeHija(hija);
    if (cab.almacen) setCentroConsumo(cab.almacen);
    if (cab.numeroPedido) setOrdenCompraHotel(cab.numeroPedido);
    if (cab.fechaIso) setFechaEntrega(cab.fechaIso);
    if (cab.anden) setAnden(cab.anden);
    if (cab.ventanaDesde) setVentanaDesde(cab.ventanaDesde);
    if (cab.ventanaHasta) setVentanaHasta(cab.ventanaHasta);
    if (cab.prioridad) setPrioridad(cab.prioridad);

    setAutoFields((prev) => {
      const next = new Set(prev);
      if (cab.almacen) next.add("centroConsumo");
      if (cab.numeroPedido) next.add("ordenCompraHotel");
      if (cab.fechaIso) next.add("fechaEntrega");
      if (cab.anden) next.add("anden");
      if (cab.ventanaDesde) next.add("ventanaDesde");
      if (cab.ventanaHasta) next.add("ventanaHasta");
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
