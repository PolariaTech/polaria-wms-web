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
  formatDecimalInputEs,
  formatPrecioEs,
  formatPrecioInputMx,
  parseDecimalEs,
  sanitizeDecimalInputEs,
  sanitizePrecioInputMx,
} from "@/lib/utils/decimal-es";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
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
  UNIDAD_MEDIDA_VENTA_DEFAULT,
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

export function useSembrarLineasDesdeOrigen(e: Record<string, any>) {
  const { lineas, hijaFormActiva, productos, open, seededOtIdsRef, skipOtSeedFromOrigenRef, step, correo, setLineas, equivalenciaByProducto } = e;
  const lineasConIndice = useMemo(() => {
    const indexed = lineas.map((linea: any, index: any) => ({ linea, index }));
    if (!hijaFormActiva) return indexed;

    const byOtId = indexed.filter(
      ({ linea }: { linea: any }) => linea.otId === hijaFormActiva.id,
    );
    if (byOtId.length > 0) return byOtId;

    // OT nueva/vacía o el resto ya tiene otId → no mezclar productos de otras tareas.
    const hijaSinProductos = hijaFormActiva.renglones.every(
      (row: any) =>
        !(row.Producto ?? "").trim() && !(row["Codigo producto"] ?? "").trim(),
    );
    if (hijaSinProductos || lineas.some((linea: any) => Boolean(linea.otId))) {
      return byOtId;
    }

    // Fallback: emparejar por nombre/código/cantidad (igual que el detalle).
    const wrapped = indexed.map(({ linea, index }: { linea: any; index: number }) => ({
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
    }) as unknown as Array<{ linea: any; index: number }>).map((row) => ({
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
      (linea: any) => linea.otId === hijaFormActiva.id,
    );
    if (hasForOt) {
      seededOtIdsRef.current.add(hijaFormActiva.id);
      return;
    }

    const seeded: LineaVentaForm[] = hijaFormActiva.renglones.map((row: any) => {
      const qty = parseDecimalEs(String(row.Cantidad ?? "")) ?? 0;
      const precio =
        typeof row.Precio === "number"
          ? row.Precio
          : (parseDecimalEs(String(row.Precio ?? "")) ?? 0);
      const nombre = row.Producto?.trim() || "Producto del correo";
      const codigo = row["Codigo producto"]?.trim() || "—";
      const query = [nombre, codigo !== "—" ? codigo : ""].filter(Boolean).join(" ");
      const suggested = suggestFromCatalogo(query, productos);
      return {
        idProducto: "",
        nombre,
        codigo,
        idBodega: suggested.sugerencia?.idBodega ?? "",
        cantidadInput: qty > 0 ? formatDecimalInputEs(qty) : "",
        cajasInput: "",
        presentacion: "",
        especificacion: "",
        descuentoPctInput: "",
        ivaPct: "0",
        kgDisponible: suggested.sugerencia?.kgDisponible ?? 0,
        unidadMedida:
          suggested.sugerencia?.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
        precioUnitario: precio,
        precioInput: formatPrecioInput(precio),
        precioManual: precio > 0,
        aliasCliente: nombre,
        filledByIa: true,
        otId: hijaFormActiva.id,
        catalogPending: true,
        catalogAmbiguo: suggested.catalogAmbiguo,
        sugerencia: suggested.sugerencia,
        sugerenciasAlternativas: suggested.sugerenciasAlternativas,
      };
    });

    seededOtIdsRef.current.add(hijaFormActiva.id);
    setLineas((prev: any) => [...prev, ...seeded]);
  }, [hijaFormActiva, lineas, open, productos, step]);

  // Recalcula sugerencias cuando el catálogo/equivalencias llegan o mejoran
  // (p. ej. después de elegir cliente, o si el match inicial falló por typo).
  useEffect(() => {
    if (!open || productos.length === 0) return;
    setLineas((prev: any) => actualizarSugerenciasDeCatalogo(prev, productos));
  }, [equivalenciaByProducto, open, productos]);
  return { lineasConIndice };
}

export function useEfectosCompaneroOv(e: Record<string, any>) {
  const { onCompanionOtPickerChange, open, cypherOpen, isEditing, editingEstado, ordenesTrabajoForm, step, formOtPage, countProductosOt, setStep, goToOtPage, setReagruparOpen } = e;
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
      hijas: ordenesTrabajoForm.map((hija: any) => ({
        id: hija.id,
        label: hija.label,
        productosCount: countProductosOt(hija),
        totalCantidad: hija.totalCantidad,
        almacen: hija.almacen,
      })),
      selectedId: ordenesTrabajoForm[selectedIndex]?.id ?? null,
      onSelect: (id: string) => {
        const index = ordenesTrabajoForm.findIndex((hija: any) => hija.id === id);
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

export function useCatalogoPickerOv(e: Record<string, any>) {
  const { replaceLineaIndex, productosParaAgregar, lineas, idComprador, compradorSugerencias, compradores, picker, setLineas, precioOverrideByProducto, productosBase } = e;
  const productosParaPicker = useMemo(() => {
    if (replaceLineaIndex == null) return productosParaAgregar;
    const lineaActiva = lineas[replaceLineaIndex];
    // Al validar pendiente: catálogo completo, pero sugerencias primero.
    if (!lineaActiva?.catalogPending) return productosParaAgregar;
    const sugIds = collectSugerenciasLinea(lineaActiva).map(
      (s: any) => s.idProducto,
    );
    if (sugIds.length === 0) return productosParaAgregar;
    const rank = new Map(sugIds.map((id: any, i: any) => [id, i]));
    return [...productosParaAgregar].sort((a: any, b: any) => {
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
    return collectSugerenciasLinea(linea).map((s: any) => s.idProducto);
  }, [lineas, replaceLineaIndex]);

  /** Catálogo completo de clientes; arriba las sugerencias de Mateo (REQ-068). */
  const compradorPickerPriorityIds = useMemo(
    () =>
      !idComprador && compradorSugerencias.length > 0
        ? compradorSugerencias.map((row: any) => row.idComprador)
        : ([] as string[]),
    [compradorSugerencias, idComprador],
  );

  /** REQ-097: identidad comercial del cliente elegido (solo lectura). */
  const compradorCatalogo = useMemo(
    () =>
      idComprador
        ? (compradores.find((row: any) => row.idComprador === idComprador) ?? null)
        : null,
    [compradores, idComprador],
  );
  const codigoClienteCatalogo = compradorCatalogo?.codigo?.trim() || "";
  /** En catálogo: «D. Comercial» = apodo (no el nombre del picker Cliente). */
  const denominacionComercialCatalogo =
    compradorCatalogo?.apodo?.trim() || "";

  const puedeAgregarProducto = productosParaAgregar.length > 0;
  const hasCatalogPending = lineas.some(
    (linea: any) => linea.catalogPending || !linea.idProducto,
  );

  useEffect(() => {
    setLineas((prev: any) => {
      let changed = false;
      const next = prev.map((linea: any) => {
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
          (row: any) => row.idProducto === linea.idProducto,
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
