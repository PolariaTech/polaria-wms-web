"use client";

import { useEffect, useMemo, useState } from "react";
import { listBodegasDestinoCompraApi } from "../../shared/services/purchases-api.service";
import type { BodegaDestinoCompraRow } from "../../shared/types/purchases-api.types";
import type {
  DestinoTipoOrden,
  OrdenCompraRow,
} from "../../shared/types/purchases.types";
import {
  formatBodegaDestinoLabel,
  parseDestinoTipoOrden,
  toFechaOrdenInputValue,
} from "../utils/orden-compra-display";
import type { OrdenCompraDestinoPatch } from "./orden-compra-detalle.types";

export interface UseOrdenCompraDestinoParams {
  orden: OrdenCompraRow | null;
  codigoCuenta: string | null;
  onDestinoChange?: (patch: OrdenCompraDestinoPatch) => void | Promise<void>;
  isSavingDestino: boolean;
}

export function useOrdenCompraDestino({
  orden,
  codigoCuenta,
  onDestinoChange,
  isSavingDestino,
}: UseOrdenCompraDestinoParams) {
  const [destinoTipo, setDestinoTipo] = useState<DestinoTipoOrden>("interna");
  const [idBodega, setIdBodega] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [bodegasDestino, setBodegasDestino] = useState<BodegaDestinoCompraRow[]>(
    [],
  );
  const [isLoadingBodegas, setIsLoadingBodegas] = useState(false);
  const [bodegasError, setBodegasError] = useState<string | null>(null);

  useEffect(() => {
    if (!orden) {
      return;
    }

    setDestinoTipo(parseDestinoTipoOrden(orden.destino_tipo));
    setIdBodega(orden.id_bodega?.trim() ?? "");
    setFechaEntrega(toFechaOrdenInputValue(orden.fecha_entrega_estimada));
  }, [orden]);

  const canEditDestino = orden?.estado === "borrador" && Boolean(onDestinoChange);

  useEffect(() => {
    if (!orden || !codigoCuenta) {
      setBodegasDestino([]);
      setBodegasError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingBodegas(true);
    setBodegasError(null);

    void listBodegasDestinoCompraApi({
      codigoCuenta,
      tipo: destinoTipo,
    })
      .then((rows) => {
        if (cancelled) {
          return;
        }

        setBodegasDestino(rows);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setBodegasDestino([]);
        setBodegasError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las bodegas destino.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingBodegas(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, destinoTipo, orden]);

  useEffect(() => {
    if (!canEditDestino || !idBodega || isLoadingBodegas || bodegasDestino.length === 0) {
      return;
    }

    if (!bodegasDestino.some((row) => row.idBodega === idBodega)) {
      setIdBodega("");
    }
  }, [bodegasDestino, canEditDestino, idBodega, isLoadingBodegas]);

  const bodegaSeleccionada = useMemo(
    () => bodegasDestino.find((row) => row.idBodega === idBodega) ?? null,
    [bodegasDestino, idBodega],
  );

  const bodegaOptions = useMemo(
    () =>
      bodegasDestino.map((bodega) => ({
        value: bodega.idBodega,
        label: formatBodegaDestinoLabel(bodega),
      })),
    [bodegasDestino],
  );

  const handleDestinoTipoChange = (nextTipo: DestinoTipoOrden) => {
    if (!canEditDestino || nextTipo === destinoTipo || isSavingDestino) {
      return;
    }

    setDestinoTipo(nextTipo);
    setIdBodega("");
    void onDestinoChange?.({ destinoTipo: nextTipo, idBodega: "" });
  };

  const handleBodegaChange = (nextBodegaId: string) => {
    if (
      !canEditDestino ||
      nextBodegaId === idBodega ||
      isSavingDestino ||
      !nextBodegaId
    ) {
      return;
    }

    setIdBodega(nextBodegaId);
    void onDestinoChange?.({ idBodega: nextBodegaId });
  };

  const handleFechaEntregaChange = (nextFecha: string) => {
    if (!canEditDestino || nextFecha === fechaEntrega || isSavingDestino) {
      return;
    }

    setFechaEntrega(nextFecha);
    void onDestinoChange?.({
      fechaEntregaEstimada: nextFecha.trim() ? nextFecha : null,
    });
  };

  return {
    destinoTipo,
    idBodega,
    fechaEntrega,
    bodegasDestino,
    isLoadingBodegas,
    bodegasError,
    canEditDestino,
    bodegaSeleccionada,
    bodegaOptions,
    handleDestinoTipoChange,
    handleBodegaChange,
    handleFechaEntregaChange,
  };
}
