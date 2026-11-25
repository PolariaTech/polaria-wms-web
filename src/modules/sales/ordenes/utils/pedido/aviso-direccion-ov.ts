"use client";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";

import { useCallback, useEffect, useMemo, type FormEvent } from "react";
import { flattenOrdenesTrabajoToOrigenCorreo } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { isGarbageOcValue } from "../../utils/pedido/normalize-numero-pedido";
import { CATALOGO_VENTA_EMPTY_MESSAGE, normalizeEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import { useFocoOrdenCompraAlAbrir } from "../../utils/pedido/resolve-cabecera-guardada";
import { applyOcPorAlmacenAOrdenesTrabajo, applyOcSinMapaAOrdenesTrabajo, extractOcAdjuntoPaths } from "./aviso-direccion-ov-occ";

export function useLeerOcDesdeAdjuntos(estado: OrdenVentaFormEstado) {
  const { step, open, ordenCompraHotel, origenAdjuntos, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft } = estado;
  useEffect(() => {
    if (step !== "form" || !open) return;
    if (ordenCompraHotel.trim() && !isGarbageOcValue(ordenCompraHotel)) {
      return;
    }
    const paths = extractOcAdjuntoPaths(origenAdjuntos);
    if (paths.length === 0) return;

    let cancelled = false;
    void (async () => {
      const byAlmacen: Record<string, string> = {};
      const occs: string[] = [];
      for (const path of paths) {
        try {
          const response = await fetch(
            `/api/ov-adjuntos/resolve-occ?path=${encodeURIComponent(String(path))}`,
          );
          if (!response.ok) continue;
          const data = (await response.json()) as {
            occ?: string | null;
            byAlmacen?: Record<string, string>;
            occs?: string[];
          };
          if (cancelled) return;
          for (const [dep, req] of Object.entries(data.byAlmacen ?? {})) {
            if (dep && req && !isGarbageOcValue(req)) byAlmacen[dep] = req;
          }
          for (const numeroOc of data.occs ?? []) {
            if (numeroOc && !isGarbageOcValue(numeroOc)) occs.push(numeroOc);
          }
          const single = (data.occ ?? "").trim();
          if (single && !isGarbageOcValue(single)) occs.push(single);
        } catch {
          /* silencioso */
        }
      }
      if (cancelled) return;
      const uniqueOccs = [...new Set(occs)];
      const occ = uniqueOccs[0] ?? "";
      if (!occ) return;

      setOrdenCompraHotel((prev) =>
        prev.trim() && !isGarbageOcValue(prev) ? prev : occ,
      );

      if (Object.keys(byAlmacen).length === 0) {
        // Sin mapa por almacén: aplicar la misma OCC a hijas con basura/vacío.
        setOrdenesTrabajoPreview((prev) => {
          const { next, changed } = applyOcSinMapaAOrdenesTrabajo(prev, occ);
          if (!changed) return prev;
          setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
          return next;
        });
        return;
      }

      setOrdenesTrabajoPreview((prev) => {
        const { next, changed } = applyOcPorAlmacenAOrdenesTrabajo(
          prev,
          byAlmacen,
        );
        if (!changed) return prev;
        setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, step, ordenCompraHotel, origenAdjuntos, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft]);
  return {  };
}

export function useCierreCapturaOv(estado: OrdenVentaFormEstado) {
  const { pendingDraftSaveAfterReorgRef, reagruparAplicada, step, isSaving, isLoading, submitIntentRef, handleSubmit, startMode, origenTexto, origenArchivoFiles, productos, isReadingIa, origenAdjuntos, open, picker, isCompradorCreateOpen, confirmDiscrepanciasOpen, confirmSaveOpen, confirmDiscardOpen, isEditing, editingEstado, setConfirmDiscardOpen, onClose, previewHijas, setStep, setError, setStartMode, setOrigenArchivoFiles } = estado;
  useEffect(() => {
    if (!pendingDraftSaveAfterReorgRef.current || !reagruparAplicada) return;
    if (step !== "form" || isSaving || isLoading) return;
    pendingDraftSaveAfterReorgRef.current = false;
    submitIntentRef.current = "draft";
    void handleSubmit({
      preventDefault() {},
    } as FormEvent<HTMLFormElement>);
  }, [handleSubmit, isLoading, isSaving, reagruparAplicada, step, pendingDraftSaveAfterReorgRef, submitIntentRef]);

  const emptyCatalogMessage = CATALOGO_VENTA_EMPTY_MESSAGE;

  const formDescription =
    startMode === "docs"
      ? "Desde mensaje o archivos · revisa y completa el pedido"
      : "Captura manual";

  const docsHasContent = Boolean(
    origenTexto.trim() || origenArchivoFiles.length > 0,
  );
  const docsReady =
    docsHasContent && productos.length > 0 && !isReadingIa;

  const hasCaptureProgress = useMemo(() => {
    if (step === "form" || step === "preview" || step === "pickOt") {
      return true;
    }
    if (startMode === "docs") {
      return Boolean(
        origenTexto.trim() ||
          origenArchivoFiles.length > 0 ||
          origenAdjuntos.length > 0,
      );
    }
    return false;
  }, [
    step,
    startMode,
    origenTexto,
    origenArchivoFiles.length,
    origenAdjuntos.length,
  ]);

  /**
   * ESC / salir: primero retrocede un paso del wizard; si ya no hay paso
   * anterior y hay progreso, pide confirmación antes de volver a Ventas.
   */
  useFocoOrdenCompraAlAbrir(open, step, isLoading);

  const requestClose = useCallback(() => {
    if (
      picker != null ||
      isCompradorCreateOpen ||
      confirmDiscrepanciasOpen ||
      confirmSaveOpen ||
      confirmDiscardOpen
    ) {
      return;
    }

    // En edición: el picker de OT está en Cypher; ESC pide salir (no vuelve a pickOt).
    // REQ-311: OV ya confirmada (u operativa) → cerrar sin “se perderá el progreso”.
    // por_confirmar sigue pidiendo confirmación (borrador Mateo).
    if (isEditing) {
      const estadoNorm = normalizeEstadoOrdenVenta(editingEstado);
      if (estadoNorm !== "por_confirmar" && estadoNorm !== "cancelada") {
        onClose();
        return;
      }
      if (hasCaptureProgress) {
        setConfirmDiscardOpen(true);
        return;
      }
      onClose();
      return;
    }

    // Alta nueva desde mensaje/archivos: retroceso por pasos del wizard.
    if (step === "form") {
      if (startMode === "docs" && previewHijas.length > 0) {
        setStep("preview");
        setError(null);
        return;
      }
    } else if (step === "preview") {
      setStep("start");
      setStartMode("docs");
      setError(null);
      return;
    } else if (step === "start" && startMode === "docs" && !docsHasContent) {
      setStartMode(null);
      setError(null);
      return;
    }

    if (hasCaptureProgress) {
      setConfirmDiscardOpen(true);
      return;
    }

    onClose();
  }, [
    picker,
    isCompradorCreateOpen,
    confirmDiscrepanciasOpen,
    confirmSaveOpen,
    confirmDiscardOpen,
    step,
    startMode,
    previewHijas.length,
    isEditing,
    editingEstado,
    docsHasContent,
    hasCaptureProgress,
    onClose,
    setConfirmDiscardOpen,
    setError,
    setStartMode,
    setStep,
  ]);

  const appendDocsFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files).slice(0, 8);
    if (next.length === 0) return;
    setOrigenArchivoFiles((prev) => {
      const merged = [...prev];
      for (const file of next) {
        if (merged.length >= 8) break;
        if (
          merged.some(
            (existing) =>
              existing.name === file.name && existing.size === file.size,
          )
        ) {
          continue;
        }
        merged.push(file);
      }
      return merged;
    });
  }, [setOrigenArchivoFiles]);

  return { emptyCatalogMessage, formDescription, docsHasContent, docsReady, requestClose, appendDocsFiles };
}

export function useFolioDesdeLista(estado: OrdenVentaFormEstado) {
  const { codigoVenta, setEditingCodigo } = estado;
  useEffect(() => {
    const fromLista = codigoVenta?.trim() || "";
    if (!fromLista) return;
    setEditingCodigo((prev: string) => prev.trim() || fromLista);
  }, [codigoVenta, setEditingCodigo]);
}
