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
  formatPrecioEs,
  formatPrecioInputMx,
  parseDecimalEs,
  sanitizeDecimalInputEs,
  sanitizePrecioInputMx,
} from "@/lib/utils/decimal-es";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
import { lineaSembradaDesdeRenglon } from "../utils/pedido/linea-sembrada-desde-origen";
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
  sugerenciaToOption,
  toDateInputValue,
} from "../utils/pedido/orden-venta-create-helpers";
import {
  type OrdenVentaOperadorRow,
  type ProductoVentaOption,
} from "../../shared/types/sales.types";
import {
  actualizarSugerenciasDeCatalogo,
  crearLineaDesdeProducto,
} from "./useLineasOv";
import {
  CATALOGO_VENTA_EMPTY_MESSAGE,
  normalizeEstadoOrdenVenta,
} from "../../shared/constants/sales-status";
import {
  aplicarReagrupacion,
  construirEstadoBaseApi,
  crearSnapshotReagrupacion,
  describirReagrupacionParaBitacora,
  firmaEstadoReagrupacion,
  puedeReagruparOt,
  type PropuestaReagrupacionApi,
} from "../utils/ot/reagrupar-ordenes-trabajo";

export function useSembrarLineasDesdeOrigen(estado: OrdenVentaFormEstado) {
  const { lineas, hijaFormActiva, productos, open, seededOtIdsRef, skipOtSeedFromOrigenRef, step, correo, setLineas, equivalenciaByProducto } = estado;
  const lineasConIndice = useMemo(() => {
    const indexed = lineas.map((linea, index) => ({ linea, index }));
    if (!hijaFormActiva) return indexed;

    const byOtId = indexed.filter(
      ({ linea }: { linea: LineaVentaForm }) => linea.otId === hijaFormActiva.id,
    );
    if (byOtId.length > 0) return byOtId;

    // OT nueva/vacía o el resto ya tiene otId → no mezclar productos de otras tareas.
    const hijaSinProductos = hijaFormActiva.renglones.every(
      (row) =>
        !(row.Producto ?? "").trim() && !(row["Codigo producto"] ?? "").trim(),
    );
    if (hijaSinProductos || lineas.some((linea) => Boolean(linea.otId))) {
      return byOtId;
    }

    // Fallback: emparejar por nombre/código/cantidad (igual que el detalle).
    const wrapped = indexed.map(({ linea, index }: { linea: LineaVentaForm; index: number }) => ({
      index,
      linea,
      cantidad_pedida: parseDecimalEs(linea.cantidadInput) ?? 0,
      matchNombre: linea.aliasCliente || linea.nombre,
      matchCodigo: linea.codigo,
      producto: {
        sku: linea.codigo,
        descripcion: linea.aliasCliente || linea.nombre,
        metadatos_catalogo: null,
      },
    }));
    return (filterLineasByOrdenTrabajoHija(wrapped, hijaFormActiva, {
      emptyFallback: "none",
    }) as unknown as Array<{ linea: LineaVentaForm; index: number }>).map((row) => ({
      linea: row.linea,
      index: row.index,
    }));
  }, [hijaFormActiva, lineas]);

  // Si el filtro OT dejó la página vacía, materializa líneas desde origen_correo.
  useEffect(() => {
    if (!open) {
      seededOtIdsRef.current = new Set();
      skipOtSeedFromOrigenRef.current = false;
      return;
    }
    if (step !== "form" || !hijaFormActiva) return;
    // REQ-195: OV ya materializada → no inventar catalogPending desde origen.
    if (skipOtSeedFromOrigenRef.current) return;
    if (hijaFormActiva.renglones.length === 0) return;
    if (seededOtIdsRef.current.has(hijaFormActiva.id)) return;

    const hasForOt = lineas.some(
      (linea) => linea.otId === hijaFormActiva.id,
    );
    if (hasForOt) {
      seededOtIdsRef.current.add(hijaFormActiva.id);
      return;
    }

    // REQ-201: un renglón ya verificado al grabar avance nace con su producto de catálogo.
    const seeded: LineaVentaForm[] = hijaFormActiva.renglones.map((row) =>
      lineaSembradaDesdeRenglon({ row, productos, otId: hijaFormActiva.id }),
    );

    seededOtIdsRef.current.add(hijaFormActiva.id);
    setLineas((prev) => [...prev, ...seeded]);
  }, [hijaFormActiva, lineas, open, productos, step]);

  // Recalcula sugerencias cuando el catálogo/equivalencias llegan o mejoran
  // (p. ej. después de elegir cliente, o si el match inicial falló por typo).
  useEffect(() => {
    if (!open || productos.length === 0) return;
    setLineas((prev) => actualizarSugerenciasDeCatalogo(prev, productos));
  }, [equivalenciaByProducto, open, productos]);
  return { lineasConIndice };
}

export function useEfectosCompaneroOv(estado: OrdenVentaFormEstado) {
  const { onCompanionOtPickerChange, open, cypherOpen, isEditing, editingEstado, ordenesTrabajoForm, step, formOtPage, countProductosOt, setStep, goToOtPage, setReagruparOpen } = estado;
  useEffect(() => {
    if (!onCompanionOtPickerChange) return;

    const shouldPublish =
      open &&
      cypherOpen &&
      isEditing &&
      normalizeEstadoOrdenVenta(editingEstado) === "por_confirmar" &&
      ordenesTrabajoForm.length >= 1 &&
      (step === "pickOt" || step === "form");

    if (!shouldPublish) {
      onCompanionOtPickerChange(null);
      return;
    }

    const selectedIndex =
      ordenesTrabajoForm.length > 0
        ? Math.min(formOtPage, ordenesTrabajoForm.length - 1)
        : 0;

    onCompanionOtPickerChange({
      hijas: ordenesTrabajoForm.map((hija) => ({
        id: hija.id,
        label: hija.label,
        productosCount: countProductosOt(hija),
        totalCantidad: hija.totalCantidad,
        almacen: hija.almacen,
      })),
      selectedId: ordenesTrabajoForm[selectedIndex]?.id ?? null,
      onSelect: (id: string) => {
        const index = ordenesTrabajoForm.findIndex((hija) => hija.id === id);
        if (index < 0) return;
        setStep("form");
        goToOtPage(index);
      },
      onReagrupar: puedeReagruparOt(editingEstado, ordenesTrabajoForm.length)
        ? () => setReagruparOpen(true)
        : undefined,
    });

    return () => {
      onCompanionOtPickerChange(null);
    };
  }, [
    countProductosOt,
    cypherOpen,
    editingEstado,
    formOtPage,
    goToOtPage,
    isEditing,
    onCompanionOtPickerChange,
    open,
    ordenesTrabajoForm,
    step,
  ]);
  return {  };
}

export function useCatalogoPickerOv(estado: OrdenVentaFormEstado) {
  const { replaceLineaIndex, productosParaAgregar, lineas, idComprador, compradorSugerencias, compradores, picker, setLineas, precioOverrideByProducto, productosBase } = estado;
  const productosParaPicker = useMemo(() => {
    if (replaceLineaIndex == null) return productosParaAgregar;
    const lineaActiva = lineas[replaceLineaIndex];
    // Al validar pendiente: catálogo completo, pero sugerencias primero.
    if (!lineaActiva?.catalogPending) return productosParaAgregar;
    const sugIds = collectSugerenciasLinea(lineaActiva).map(
      (s) => s.idProducto,
    );
    if (sugIds.length === 0) return productosParaAgregar;
    const rank = new Map(sugIds.map((id, i) => [id, i]));
    return [...productosParaAgregar].sort((a, b) => {
      const ra = rank.has(a.idProducto) ? rank.get(a.idProducto)! : 10_000;
      const rb = rank.has(b.idProducto) ? rank.get(b.idProducto)! : 10_000;
      if (ra !== rb) return ra - rb;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [lineas, productosParaAgregar, replaceLineaIndex]);

  const productoPickerPriorityIds = useMemo(() => {
    if (replaceLineaIndex == null) return [] as string[];
    const linea = lineas[replaceLineaIndex];
    if (!linea?.catalogPending) return [];
    return collectSugerenciasLinea(linea).map((s) => s.idProducto);
  }, [lineas, replaceLineaIndex]);

  /** Catálogo completo de clientes; arriba las sugerencias de Mateo (REQ-068). */
  const compradorPickerPriorityIds = useMemo(
    () =>
      !idComprador && compradorSugerencias.length > 0
        ? compradorSugerencias.map((row) => row.idComprador)
        : ([] as string[]),
    [compradorSugerencias, idComprador],
  );

  /** REQ-097: identidad comercial del cliente elegido (solo lectura). */
  const compradorCatalogo = useMemo(
    () =>
      idComprador
        ? (compradores.find((row) => row.idComprador === idComprador) ?? null)
        : null,
    [compradores, idComprador],
  );
  const codigoClienteCatalogo = compradorCatalogo?.codigo?.trim() || "";
  /** En catálogo: «D. Comercial» = apodo (no el nombre del picker Cliente). */
  const denominacionComercialCatalogo =
    compradorCatalogo?.apodo?.trim() || "";

  const puedeAgregarProducto = productosParaAgregar.length > 0;
  const hasCatalogPending = lineas.some(
    (linea) => linea.catalogPending || !linea.idProducto,
  );

  useEffect(() => {
    setLineas((prev) => {
      let changed = false;
      const next = prev.map((linea) => {
        if (linea.precioManual || !linea.idProducto || linea.catalogPending) {
          return linea;
        }
        const override = precioOverrideByProducto[linea.idProducto];
        if (override != null) {
          if (linea.precioUnitario === override) return linea;
          changed = true;
          return {
            ...linea,
            precioUnitario: override,
            precioInput: formatPrecioInput(override),
          };
        }
        const base = productosBase.find(
          (row) => row.idProducto === linea.idProducto,
        );
        if (!base || linea.precioUnitario === base.precioUnitario) {
          return linea;
        }
        changed = true;
        return {
          ...linea,
          precioUnitario: base.precioUnitario,
          precioInput: formatPrecioInput(base.precioUnitario),
        };
      });
      return changed ? next : prev;
    });
  }, [precioOverrideByProducto, productosBase]);

  return { productosParaPicker, productoPickerPriorityIds, compradorPickerPriorityIds, compradorCatalogo, codigoClienteCatalogo, denominacionComercialCatalogo, puedeAgregarProducto, hasCatalogPending };
}
