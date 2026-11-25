"use client";

import { useEffect, useMemo } from "react";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import {
  collectSugerenciasLinea,
  formatPrecioInput,
} from "../utils/pedido/orden-venta-create-helpers";
import { resolverCompradorPickerSugerencias } from "../utils/match/resolver-comprador-picker-priority-ids";

export function useCatalogoPickerOv(estado: OrdenVentaFormEstado) {
  const {
    replaceLineaIndex,
    productosParaAgregar,
    lineas,
    idComprador,
    compradorSugerencias,
    compradores,
    compradorNombreIa,
    compradorLabel,
    origenCorreoDraft,
    setLineas,
    precioOverrideByProducto,
    productosBase,
  } = estado;

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

  const nombreEnOrigen = useMemo(() => {
    const rows = Array.isArray(origenCorreoDraft) ? origenCorreoDraft : [];
    return (
      rows.map((row) => row["Nombre cliente"]?.trim()).find(Boolean) || ""
    );
  }, [origenCorreoDraft]);

  /** REQ-068/326: mismo patrón que productos — sugerencias arriba + badge. */
  const { compradorPickerPriorityIds, compradoresParaPicker } = useMemo(() => {
    const out = resolverCompradorPickerSugerencias({
      compradores,
      compradorNombreIa,
      compradorLabel,
      idComprador,
      nombreEnOrigen,
      compradorSugerencias,
    });
    return {
      compradorPickerPriorityIds: out.priorityIds,
      compradoresParaPicker: out.compradoresParaPicker,
    };
  }, [
    compradores,
    compradorNombreIa,
    compradorLabel,
    idComprador,
    nombreEnOrigen,
    compradorSugerencias,
  ]);

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
  }, [precioOverrideByProducto, productosBase, setLineas]);

  return {
    productosParaPicker,
    productoPickerPriorityIds,
    compradorPickerPriorityIds,
    compradoresParaPicker,
    compradorCatalogo,
    codigoClienteCatalogo,
    denominacionComercialCatalogo,
    puedeAgregarProducto,
    hasCatalogPending,
  };
}
