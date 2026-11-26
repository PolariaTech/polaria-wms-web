"use client";

import { useEffect, useMemo } from "react";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import {
  collectSugerenciasLinea,
} from "../utils/pedido/orden-venta-create-helpers";
import { resolverCompradorPickerSugerencias } from "../utils/match/resolver-comprador-picker-priority-ids";
import { aplicarPrecioFaltanteALinea } from "../utils/pedido/precio-cuando-falta-solicitud";
import { usePreciosSeparados } from "./precios-comprador-separados";

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
  const preciosSeparados = usePreciosSeparados();
  const firmaPrecio = lineas
    .map(
      (linea) =>
        `${linea.idProducto}:${linea.precioManual === false ? "0" : "1"}:${linea.catalogPending ? "p" : "l"}:${linea.precioUnitario}`,
    )
    .join("|");

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
    const separados =
      Object.keys(precioOverrideByProducto).length === 0
        ? { ultimos: {}, equivalencia: {} }
        : preciosSeparados;
    setLineas((prev) => {
      let changed = false;
      const next = prev.map((linea) => {
        const aplicada = aplicarPrecioFaltanteALinea(
          linea,
          separados,
          productosBase,
          precioOverrideByProducto[linea.idProducto],
        );
        if (aplicada === linea) return linea;
        changed = true;
        return aplicada;
      });
      return changed ? next : prev;
    });
  }, [firmaPrecio, precioOverrideByProducto, preciosSeparados, productosBase, setLineas]);

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
