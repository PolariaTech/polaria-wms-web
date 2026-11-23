"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWarehouseStateRealtime } from "@/hooks/warehouse/useWarehouseStateRealtime";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { listOrdenesCompra } from "@/modules/purchases";
import type { OrdenCompraRow } from "@/modules/purchases";
import { listOrdenesVentaOperador } from "@/modules/sales";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import { listViajesEntrega } from "@/modules/transport";
import {
  listUbicacionesEstadoBodega,
  mapEstadoBodegaLayout,
} from "@/modules/warehouses";
import {
  countUbicacionesEntrada,
  resolveUbicacionIngresoDisponible,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-ingreso";
import type { EstadoBodegaSlot } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import {
  buildEmptySection,
  ORDENES_EN_TRANSPORTE,
} from "./custodio-ingreso-page.helpers";

export function useCustodioIngresoPage() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [ubicaciones, setUbicaciones] = useState<
    Awaited<ReturnType<typeof listUbicacionesEstadoBodega>>
  >([]);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const [ordenes, setOrdenes] = useState<OrdenCompraRow[]>([]);
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState("");

  const [ventas, setVentas] = useState<OrdenVentaOperadorRow[]>([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<EstadoBodegaSlot | null>(
    null,
  );

  const {
    rows: warehouseRows,
    isConnected,
    isLoading: isLoadingWarehouse,
    error: warehouseError,
    refetch: refetchWarehouseState,
  } = useWarehouseStateRealtime();

  const handleSelectSlot = useCallback((slot: EstadoBodegaSlot) => {
    if (slot.visual === "vacia" || !slot.detalle) return;
    setSelectedSlot(slot);
  }, []);

  const loadUbicaciones = useCallback(async () => {
    if (!activeBodegaId) {
      setUbicaciones([]);
      return;
    }

    setIsLoadingLayout(true);
    setLayoutError(null);

    try {
      const rows = await listUbicacionesEstadoBodega(activeBodegaId);
      setUbicaciones(rows);
    } catch (error) {
      setLayoutError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el layout de la bodega.",
      );
      setUbicaciones([]);
    } finally {
      setIsLoadingLayout(false);
    }
  }, [activeBodegaId]);

  const loadOrdenes = useCallback(async () => {
    if (!codigoCuenta) {
      setOrdenes([]);
      return;
    }

    setIsLoadingOrdenes(true);

    try {
      const rows = await listOrdenesCompra({
        codigoCuenta,
        idBodega: activeBodegaId,
      });
      setOrdenes(rows.filter((row) => ORDENES_EN_TRANSPORTE.has(row.estado)));
    } catch {
      setOrdenes([]);
    } finally {
      setIsLoadingOrdenes(false);
    }
  }, [activeBodegaId, codigoCuenta]);

  const loadVentas = useCallback(async () => {
    if (!codigoCuenta) {
      setVentas([]);
      return;
    }

    setIsLoadingVentas(true);

    try {
      const [rows, viajes] = await Promise.all([
        listOrdenesVentaOperador({ codigoCuenta }),
        listViajesEntrega({ codigoCuenta }).catch(() => []),
      ]);
      const enTransporte = new Set(
        viajes
          .map((viaje) => viaje.idOrdenVenta?.trim())
          .filter((id): id is string => Boolean(id)),
      );
      setVentas(
        rows.filter((row) => !enTransporte.has(row.idOrdenVenta)),
      );
    } catch {
      setVentas([]);
    } finally {
      setIsLoadingVentas(false);
    }
  }, [codigoCuenta]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones]);

  useEffect(() => {
    void loadOrdenes();
  }, [loadOrdenes]);

  useEffect(() => {
    void loadVentas();
  }, [loadVentas]);

  const layout = useMemo(
    () => mapEstadoBodegaLayout(ubicaciones, warehouseRows),
    [ubicaciones, warehouseRows],
  );

  const slotsIngresoCount = useMemo(
    () => countUbicacionesEntrada(ubicaciones),
    [ubicaciones],
  );

  const resolveUbicacionIngreso = useCallback(
    () => resolveUbicacionIngresoDisponible(ubicaciones, warehouseRows),
    [ubicaciones, warehouseRows],
  );

  const handleIngresoRegistrado = useCallback(async () => {
    await Promise.all([
      loadOrdenes(),
      loadUbicaciones(),
      refetchWarehouseState(),
    ]);
  }, [loadOrdenes, loadUbicaciones, refetchWarehouseState]);

  const handlePaqueteEnviado = useCallback(async () => {
    await Promise.all([
      loadVentas(),
      loadUbicaciones(),
      refetchWarehouseState(),
    ]);
  }, [loadUbicaciones, loadVentas, refetchWarehouseState]);

  const zonaIngreso =
    layout.sections.find((section) => section.id === "entrada") ??
    buildEmptySection("entrada");
  const zonaSalida =
    layout.sections.find((section) => section.id === "salida") ??
    buildEmptySection("salida");

  const cajasEnSalida = zonaSalida.slots.filter(
    (slot) => slot.visual !== "vacia",
  ).length;

  const isLoading = isLoadingLayout || isLoadingWarehouse;
  const error = layoutError ?? warehouseError;

  return {
    codigoCuenta,
    activeBodegaId,
    ubicaciones,
    ordenes,
    isLoadingOrdenes,
    selectedOrdenId,
    setSelectedOrdenId,
    ventas,
    isLoadingVentas,
    selectedSlot,
    setSelectedSlot,
    isConnected,
    handleSelectSlot,
    loadOrdenes,
    loadVentas,
    slotsIngresoCount,
    resolveUbicacionIngreso,
    handleIngresoRegistrado,
    handlePaqueteEnviado,
    zonaIngreso,
    zonaSalida,
    cajasEnSalida,
    isLoading,
    error,
  };
}
