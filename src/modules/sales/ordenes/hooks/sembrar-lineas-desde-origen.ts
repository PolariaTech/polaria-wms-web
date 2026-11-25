"use client";

import { useEffect, useMemo } from "react";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
import { lineaSembradaDesdeRenglon } from "../utils/pedido/linea-sembrada-desde-origen";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { actualizarSugerenciasDeCatalogo } from "./useLineasOv";
import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { puedeReagruparOt } from "../utils/ot/reagrupar-ordenes-trabajo";

export function useSembrarLineasDesdeOrigen(estado: OrdenVentaFormEstado) {
  const { lineas, hijaFormActiva, productos, open, seededOtIdsRef, skipOtSeedFromOrigenRef, step, setLineas, equivalenciaByProducto } = estado;
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
  }, [hijaFormActiva, lineas, open, productos, step, seededOtIdsRef, setLineas, skipOtSeedFromOrigenRef]);

  // Recalcula sugerencias cuando el catálogo/equivalencias llegan o mejoran
  // (p. ej. después de elegir cliente, o si el match inicial falló por typo).
  useEffect(() => {
    if (!open || productos.length === 0) return;
    setLineas((prev) => actualizarSugerenciasDeCatalogo(prev, productos));
  }, [equivalenciaByProducto, open, productos, setLineas]);
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
    step, setReagruparOpen, setStep,
  ]);
  return {  };
}

import { useCatalogoPickerOv } from "./sembrar-lineas-desde-origen-catalogo-picker";

export { useCatalogoPickerOv };
