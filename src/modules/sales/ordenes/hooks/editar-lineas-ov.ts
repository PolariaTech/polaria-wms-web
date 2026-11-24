"use client";

import { useCallback, useEffect } from "react";
import { applyProductoToLinea, sugerenciaToOption } from "../utils/pedido/orden-venta-create-helpers";
import { crearLineaDesdeProducto } from "./useLineasOv";
import { flattenOrdenesTrabajoToOrigenCorreo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { type ProductoVentaOption } from "../../shared/types/sales.types";
import type { LineaSugerenciaCatalogo } from "../types/orden-venta-create-modal.types";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { formatDecimalInputEs, formatPrecioInputMx, parseDecimalEs, sanitizeDecimalInputEs, sanitizePrecioInputMx } from "@/lib/utils/decimal-es";
import { useClearFieldMarksOv } from "./clear-field-marks-ov";
import { agregarProductoAOrdenesTrabajo, resolveOtIdParaLineaNueva } from "./editar-lineas-ov-helpers";

export { resolveOtIdParaLineaNueva };

export function useEditarLineasOv(estado: OrdenVentaFormEstado) {
  const { replaceLineaIndex, setLineas, setReplaceLineaIndex, setCantidadFocusId, setError, setIdBodegaDestino, restoreFormScroll, hijaFormActiva, ordenesTrabajoForm, setOrdenesTrabajoPreview, origenCorreoDraft, setOrigenCorreoDraft, captureFormScroll, setPicker, cantidadFocusId, picker, lineas, setAutoFields, setWarnFields, setMissingFields, setDiscrepancias, warnFields, centroConsumo, direccion, anden, contacto, telefono, correo, ventanaDesde, ventanaHasta, ordenCompraHotel, observaciones, fechaEntrega } = estado;
  const handleSelectProducto = useCallback(
    (row: ProductoVentaOption) => {
      if (replaceLineaIndex != null) {
        const index = replaceLineaIndex;
        setLineas((prev) =>
          prev.map((linea, i) =>
            i === index ? applyProductoToLinea(linea, row) : linea,
          ),
        );
        setReplaceLineaIndex(null);
        setCantidadFocusId(row.idProducto);
        setError(null);
        setIdBodegaDestino((prev) => prev || row.idBodega);
        restoreFormScroll();
        return;
      }

      setCantidadFocusId(row.idProducto);
      const otId = resolveOtIdParaLineaNueva({
        hijaFormActivaId: hijaFormActiva?.id,
        ordenesTrabajoIds: ordenesTrabajoForm.map((hija) => hija.id),
      });
      setLineas((prev) => [...prev, crearLineaDesdeProducto(row, otId)]);
      if (otId) {
        setOrdenesTrabajoPreview((prev) => {
          const next = agregarProductoAOrdenesTrabajo({
            prev,
            origenCorreoDraft,
            otId,
            row,
          });
          setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
          return next;
        });
      }
      setError(null);
      setIdBodegaDestino((prev) => prev || row.idBodega);
    },
    [
      hijaFormActiva?.id,
      ordenesTrabajoForm,
      origenCorreoDraft,
      replaceLineaIndex,
      restoreFormScroll, setCantidadFocusId, setError, setIdBodegaDestino, setLineas, setOrdenesTrabajoPreview, setOrigenCorreoDraft, setReplaceLineaIndex,
    ],
  );

  const handleOpenReplaceProducto = useCallback(
    (index: number) => {
      captureFormScroll();
      setReplaceLineaIndex(index);
      setPicker("producto");
    },
    [captureFormScroll, setPicker, setReplaceLineaIndex],
  );

  const handleAcceptSugerencia = useCallback(
    (index: number, sug?: LineaSugerenciaCatalogo | null) => {
      setLineas((prev) => {
        const linea = prev[index];
        const chosen = sug ?? linea?.sugerencia;
        if (!linea || !chosen) return prev;
        return prev.map((row, i) =>
          i === index
            ? applyProductoToLinea(row, sugerenciaToOption(chosen))
            : row,
        );
      });
      setError(null);
      setPicker(null);
      setReplaceLineaIndex(null);
      restoreFormScroll();
    },
    [restoreFormScroll, setError, setLineas, setPicker, setReplaceLineaIndex],
  );

  useEffect(() => {
    if (!cantidadFocusId || picker !== null) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(
        `orden-venta-cantidad-${cantidadFocusId}`,
      );
      // preventScroll: si no, al validar producto el modal salta al primer ítem.
      el?.focus({ preventScroll: true });
      restoreFormScroll();
      setCantidadFocusId(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cantidadFocusId, lineas, picker, restoreFormScroll, setCantidadFocusId]);

  const handleRemoveLinea = useCallback((index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, [setError, setLineas]);

  const clearFieldMarks = useClearFieldMarksOv({
    warnFields,
    valoresActuales: {
      centroConsumo,
      direccion,
      anden,
      contacto,
      telefono,
      correo,
      ventanaDesde,
      ventanaHasta,
      ordenCompraHotel,
      observaciones,
      fechaEntrega,
    },
    setAutoFields,
    setWarnFields,
    setMissingFields,
    setDiscrepancias,
  });

  const handleCantidadChange = useCallback((index: number, value: string) => {
    const nextValue = sanitizeDecimalInputEs(value);
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? { ...linea, cantidadInput: nextValue, filledByIa: false }
          : linea,
      ),
    );
  }, [setLineas]);

  const handleCantidadBlur = useCallback((index: number, value: string) => {
    const parsed = parseDecimalEs(value);
    if (parsed == null || parsed <= 0) return;
    const formatted = formatDecimalInputEs(parsed);
    if (formatted === value) return;
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index ? { ...linea, cantidadInput: formatted } : linea,
      ),
    );
  }, [setLineas]);

  const handleLineaFieldChange = useCallback(
    (
      index: number,
      field: "especificacion" | "ivaPct",
      value: string,
    ) => {
      setLineas((prev) =>
        prev.map((linea, i) =>
          i === index
            ? { ...linea, [field]: value, filledByIa: false }
            : linea,
        ),
      );
    },
    [setLineas],
  );

  const handlePrecioChange = useCallback((index: number, value: string) => {
    const nextValue = sanitizePrecioInputMx(value);
    setLineas((prev) =>
      prev.map((linea, i) => {
        if (i !== index) return linea;
        const parsed = parseDecimalEs(nextValue);
        return {
          ...linea,
          precioInput: nextValue,
          precioUnitario: parsed != null && parsed > 0 ? parsed : 0,
          precioManual: true,
          filledByIa: false,
        };
      }),
    );
  }, [setLineas]);

  const handlePrecioBlur = useCallback((index: number, value: string) => {
    const parsed = parseDecimalEs(value);
    if (parsed == null || parsed <= 0) return;
    const formatted = formatPrecioInputMx(parsed);
    if (formatted === value) return;
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? {
              ...linea,
              precioInput: formatted,
              precioUnitario: parsed,
            }
          : linea,
      ),
    );
  }, [setLineas]);
  return { handleSelectProducto, handleOpenReplaceProducto, handleAcceptSugerencia, handleRemoveLinea, clearFieldMarks, handleCantidadChange, handleCantidadBlur, handleLineaFieldChange, handlePrecioChange, handlePrecioBlur };
}
