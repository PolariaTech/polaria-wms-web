"use client";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";

import { useCallback, useEffect, useMemo, type FormEvent } from "react";
import {
  createEmptyOrdenTrabajoHija,
  flattenOrdenesTrabajoToOrigenCorreo,
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import {
  isGarbageOcValue,
  resolveOrdenCompraLimpia,
  sanitizeOrigenCorreoNumeroPedido,
} from "../../utils/pedido/normalize-numero-pedido";
import {
  CATALOGO_VENTA_EMPTY_MESSAGE,
  normalizeEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import {
  resolveCabeceraGuardada,
  resolvePropuestaClienteMateoAlReabrir,
  useFocoOrdenCompraAlAbrir,
} from "../../utils/pedido/resolve-cabecera-guardada";

export function useLeerOcDesdeAdjuntos(estado: OrdenVentaFormEstado) {
  const { step, open, ordenCompraHotel, origenAdjuntos, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft } = estado;
  useEffect(() => {
    if (step !== "form" || !open) return;
    if (ordenCompraHotel.trim() && !isGarbageOcValue(ordenCompraHotel)) {
      return;
    }
    const paths = [
      ...new Set(
        origenAdjuntos
          .filter((item) => {
            if (!item.path?.trim()) return false;
            const name = item.nombre.toLowerCase();
            const mime = (item.mime ?? "").toLowerCase();
            return (
              name.endsWith(".eml") ||
              mime.includes("message") ||
              name.endsWith(".pdf")
            );
          })
          .map((item) => item.path!.trim()),
      ),
    ];
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
          if (prev.length === 0) return prev;
          let changed = false;
          const next = prev.map((hija) => {
            const cur = hija.numeroPedido?.trim() || "";
            if (cur && !isGarbageOcValue(cur)) return hija;
            changed = true;
            return {
              ...hija,
              numeroPedido: occ,
              renglones: hija.renglones.map((row) => ({
                ...row,
                "Numero pedido": occ,
              })),
              label:
                occ && hija.almacen ? `${occ} — ${hija.almacen}` : hija.label,
            };
          });
          if (!changed) return prev;
          setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
          return next;
        });
        return;
      }

      setOrdenesTrabajoPreview((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((hija) => {
          const alm = (hija.almacen || "").trim().toLowerCase();
          if (!alm) return hija;
          let matched = "";
          for (const [dep, req] of Object.entries(byAlmacen)) {
            const depNormalizado = dep.trim().toLowerCase();
            if (!depNormalizado || !req) continue;
            if (alm.includes(depNormalizado) || depNormalizado.includes(alm) || alm === depNormalizado) {
              matched = req;
              break;
            }
            // Match por código corto (CBEEFB vs CBEEFE BEEF BAR).
            const code = alm.split(/\s+/)[0] ?? "";
            const depCode = depNormalizado.split(/\s+/)[0] ?? "";
            if (
              code &&
              depCode &&
              (code.startsWith(depCode.slice(0, 5)) ||
                depCode.startsWith(code.slice(0, 5)))
            ) {
              matched = req;
              break;
            }
          }
          if (!matched) return hija;
          const cur = hija.numeroPedido?.trim() || "";
          if (cur === matched || (!isGarbageOcValue(cur) && cur)) {
            return hija;
          }
          changed = true;
          return {
            ...hija,
            numeroPedido: matched,
            renglones: hija.renglones.map((row) => ({
              ...row,
              "Numero pedido": matched,
            })),
            label:
              matched && hija.almacen
                ? `${matched} — ${hija.almacen}`
                : hija.label,
          };
        });
        if (!changed) return prev;
        setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, step, ordenCompraHotel, origenAdjuntos]);
  return {  };
}

export function useCierreCapturaOv(estado: OrdenVentaFormEstado) {
  const { pendingDraftSaveAfterReorgRef, reagruparAplicada, step, isSaving, isLoading, submitIntentRef, handleSubmit, startMode, origenTexto, origenArchivoFiles, productos, isReadingIa, origenAdjuntos, open, picker, isCompradorCreateOpen, confirmDiscrepanciasOpen, confirmSaveOpen, confirmDiscardOpen, isEditing, setConfirmDiscardOpen, onClose, previewHijas, setStep, setError, setStartMode, ordenesTrabajoForm, setOrigenArchivoFiles } = estado;
  useEffect(() => {
    if (!pendingDraftSaveAfterReorgRef.current || !reagruparAplicada) return;
    if (step !== "form" || isSaving || isLoading) return;
    pendingDraftSaveAfterReorgRef.current = false;
    submitIntentRef.current = "draft";
    void handleSubmit({
      preventDefault() {},
    } as FormEvent<HTMLFormElement>);
  }, [handleSubmit, isLoading, isSaving, reagruparAplicada, step]);

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
    if (isEditing) {
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
    ordenesTrabajoForm.length,
    docsHasContent,
    hasCaptureProgress,
    onClose,
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
  }, []);

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
