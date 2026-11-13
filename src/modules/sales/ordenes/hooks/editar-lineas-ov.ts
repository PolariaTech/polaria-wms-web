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
  actualizarSugerenciasDeCatalogo,
  crearLineaDesdeProducto,
} from "./useLineasOv";
import {
  createEmptyOrdenTrabajoHija,
  flattenOrdenesTrabajoToOrigenCorreo,
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { stripLeadingProductoCodigo } from "../../shared/utils/producto-venta-nombre";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type OrdenVentaOperadorRow,
  type ProductoVentaOption,
} from "../../shared/types/sales.types";
import type {
  BodegaDestinoOption,
  CaptureStep,
  LineaSugerenciaCatalogo,
  LineaVentaForm,
  OrdenVentaCreateModalProps,
  PickerKind,
  ReagrupacionAplicada,
  StartMode,
} from "../types/orden-venta-create-modal.types";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import {
  formatDecimalInputEs,
  formatPrecioEs,
  formatPrecioInputMx,
  parseDecimalEs,
  sanitizeDecimalInputEs,
  sanitizePrecioInputMx,
} from "@/lib/utils/decimal-es";

export function useEditarLineasOv(estado: OrdenVentaFormEstado) {
  const { replaceLineaIndex, setLineas, setReplaceLineaIndex, setCantidadFocusId, setError, setIdBodegaDestino, restoreFormScroll, hijaFormActiva, setOrdenesTrabajoPreview, origenCorreoDraft, setOrigenCorreoDraft, captureFormScroll, setPicker, cantidadFocusId, picker, lineas, setAutoFields, setWarnFields, setMissingFields, setDiscrepancias } = estado;
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
      const otId = hijaFormActiva?.id;
      setLineas((prev) => [...prev, crearLineaDesdeProducto(row, otId)]);
      if (otId) {
        setOrdenesTrabajoPreview((prev) => {
          const base =
            prev.length > 0
              ? prev
              : groupOrigenCorreoToOrdenesTrabajo(origenCorreoDraft);
          const next = base.map((hija) => {
            if (hija.id !== otId) return hija;
            const sinPlaceholder = hija.renglones.filter(
              (renglon) =>
                (renglon.Producto ?? "").trim() ||
                (renglon["Codigo producto"] ?? "").trim(),
            );
            const renglon: OrigenCorreoRenglon = {
              _otId: hija.id,
              Almacen: hija.almacen,
              "Numero pedido": hija.numeroPedido,
              Fecha: hija.fecha,
              "Referencia pedido": hija.referenciaPedido,
              "Responsable externo": hija.responsableExterno,
              Producto: stripLeadingProductoCodigo(row.nombre, row.codigo),
              "Codigo producto": row.codigo,
              Cantidad: 0,
              Unidad: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
              Precio: row.precioUnitario,
            };
            const renglones = [...sinPlaceholder, renglon];
            return {
              ...hija,
              renglones,
              totalCantidad: renglones.reduce((sum, item) => {
                const qty =
                  typeof item.Cantidad === "number"
                    ? item.Cantidad
                    : Number(String(item.Cantidad ?? "").replace(",", ".")) ||
                      0;
                return sum + qty;
              }, 0),
            };
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
      origenCorreoDraft,
      replaceLineaIndex,
      restoreFormScroll,
    ],
  );

  const handleOpenReplaceProducto = useCallback(
    (index: number) => {
      captureFormScroll();
      setReplaceLineaIndex(index);
      setPicker("producto");
    },
    [captureFormScroll],
  );

  const handleOpenSugerenciasProducto = useCallback(
    (index: number) => {
      captureFormScroll();
      setReplaceLineaIndex(index);
      setPicker("sugerencias");
    },
    [captureFormScroll],
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
    [restoreFormScroll],
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
  }, [cantidadFocusId, lineas, picker, restoreFormScroll]);

  const handleRemoveLinea = useCallback((index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const clearFieldMarks = useCallback((field: string) => {
    setAutoFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    setWarnFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    setMissingFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    // REQ-118: al editar el campo, quitar la discrepancia vieja (evita falsa alerta).
    setDiscrepancias((prev) => {
      if (!prev.some((row) => row.fieldKey === field)) return prev;
      return prev.filter((row) => row.fieldKey !== field);
    });
  }, []);

  const handleCantidadChange = useCallback((index: number, value: string) => {
    const nextValue = sanitizeDecimalInputEs(value);
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? { ...linea, cantidadInput: nextValue, filledByIa: false }
          : linea,
      ),
    );
  }, []);

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
  }, []);

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
    [],
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
  }, []);

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
  }, []);
  return { handleSelectProducto, handleOpenReplaceProducto, handleAcceptSugerencia, handleRemoveLinea, clearFieldMarks, handleCantidadChange, handleCantidadBlur, handleLineaFieldChange, handlePrecioChange, handlePrecioBlur };
}
