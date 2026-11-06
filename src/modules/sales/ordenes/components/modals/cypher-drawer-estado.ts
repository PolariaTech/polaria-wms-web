"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
  estadosSuperioresOrdenVenta,
  formatEstadoOrdenVenta,
  normalizeEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import { avanzarEstadoOrdenVenta } from "../../../shared/services/sales.service";
import type { EstadoOrdenVenta, OrdenVentaDetalleRow, OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import { postOrdenVentaLog } from "../../services/orden-venta-log.client";

interface UseCypherDrawerEstadoArgs {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  row: OrdenVentaOperadorRow | null;
  orden: OrdenVentaDetalleRow | null;
  setOrden: Dispatch<SetStateAction<OrdenVentaDetalleRow | null>>;
  onEstadoCambiado?: () => void;
  bumpLogNonce: () => void;
}

export function useCypherDrawerEstado({
  idOrdenVenta,
  codigoCuenta,
  row,
  orden,
  setOrden,
  onEstadoCambiado,
  bumpLogNonce,
}: UseCypherDrawerEstadoArgs) {
  const [estadoForzado, setEstadoForzado] = useState<EstadoOrdenVenta | null>(null);
  const [estadoCambiando, setEstadoCambiando] = useState<EstadoOrdenVenta | null>(null);
  const [estadoPendiente, setEstadoPendiente] = useState<EstadoOrdenVenta | null>(null);
  const [cambioEstadoError, setCambioEstadoError] = useState<string | null>(null);

  const estado = normalizeEstadoOrdenVenta(
    estadoForzado ?? row?.estado ?? orden?.estado ?? "por_confirmar",
  ) as EstadoOrdenVenta;
  const estadosSuperiores = estadosSuperioresOrdenVenta(estado);

  const cambiarEstado = useCallback(
    (destino: EstadoOrdenVenta) => {
      if (!idOrdenVenta || !codigoCuenta || estadoCambiando) return;
      setCambioEstadoError(null);
      setEstadoCambiando(destino);
      void avanzarEstadoOrdenVenta({
        codigoCuenta,
        idOrdenVenta,
        estado: destino,
      })
        .then(() => {
          setEstadoPendiente(null);
          setEstadoForzado(destino);
          setOrden((prev) => (prev ? { ...prev, estado: destino } : prev));
          bumpLogNonce();
          const session = useAuthStore.getState().session;
          const autor = session?.nombre?.trim() || "usuario";
          void postOrdenVentaLog({
            idOrdenVenta,
            codigoCuenta,
            accion: "cambio_estado",
            mensaje: `Estado de la orden actualizado a ${formatEstadoOrdenVenta(destino)} por ${autor}.`,
            idUsuario: session?.idUsuario ?? null,
            autorNombre: session?.nombre ?? null,
            idBodega: row?.idBodega ?? orden?.id_bodega ?? null,
            payloadExtra: {
              tipo: "cambio_estado_manual",
              estadoAnterior: estado,
              estadoNuevo: destino,
            },
          });
          onEstadoCambiado?.();
        })
        .catch((err: unknown) => {
          setCambioEstadoError(
            err instanceof Error ? err.message : "No se pudo cambiar el estado.",
          );
        })
        .finally(() => {
          setEstadoCambiando(null);
        });
    },
    [
      bumpLogNonce,
      codigoCuenta,
      estado,
      estadoCambiando,
      idOrdenVenta,
      onEstadoCambiado,
      orden?.id_bodega,
      row?.idBodega,
      setOrden,
    ],
  );

  const resetEstadoUi = useCallback(() => {
    setEstadoForzado(null);
    setEstadoCambiando(null);
    setEstadoPendiente(null);
    setCambioEstadoError(null);
  }, []);

  return {
    estado,
    estadosSuperiores,
    estadoCambiando,
    estadoPendiente,
    setEstadoPendiente,
    cambioEstadoError,
    setCambioEstadoError,
    cambiarEstado,
    resetEstadoUi,
  };
}
