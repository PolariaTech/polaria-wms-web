"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import type { OperarioDisponibleApiRow } from "@/modules/operations";
import { listOperariosBodegaDisponibles } from "../services/jefe-bodega-operarios.service";

interface UseJefeBodegaOperarioAsignacionParams {
  open: boolean;
  codigoCuenta: string | null;
  idBodega: string | null;
}

export interface JefeBodegaOperarioAsignacionState {
  operarios: OperarioDisponibleApiRow[];
  disponibles: OperarioDisponibleApiRow[];
  showPicker: boolean;
  idSeleccionado: string;
  setIdSeleccionado: (idUsuario: string) => void;
  idAsignado: string | null;
  canAssign: boolean;
  blockReason: string | null;
  isLoading: boolean;
  loadError: string | null;
  operarioUnico: OperarioDisponibleApiRow | null;
}

export function useJefeBodegaOperarioAsignacion({
  open,
  codigoCuenta,
  idBodega,
}: UseJefeBodegaOperarioAsignacionParams): JefeBodegaOperarioAsignacionState {
  const enabled = open && Boolean(codigoCuenta?.trim()) && Boolean(idBodega?.trim());
  const [idSeleccionado, setIdSeleccionado] = useState("");

  const fetcher = useCallback(async () => {
    if (!codigoCuenta?.trim() || !idBodega?.trim()) {
      return [];
    }
    return listOperariosBodegaDisponibles({
      codigoCuenta: codigoCuenta.trim(),
      idBodega: idBodega.trim(),
    });
  }, [codigoCuenta, idBodega]);

  const { data, isLoading, error: loadError } = useAsyncQuery(fetcher, enabled);

  const operarios = useMemo(() => data ?? [], [data]);
  const disponibles = useMemo(
    () => operarios.filter((operario) => operario.disponible),
    [operarios],
  );
  const multiples = operarios.length > 1;
  const showPicker = multiples && disponibles.length > 0;
  const operarioUnico = operarios.length === 1 ? operarios[0] : null;

  useEffect(() => {
    if (!open) {
      setIdSeleccionado("");
    }
  }, [open]);

  useEffect(() => {
    if (!enabled || isLoading) return;

    if (showPicker && disponibles.length > 0) {
      setIdSeleccionado((current) => {
        if (current && disponibles.some((o) => o.idUsuario === current)) {
          return current;
        }
        return disponibles[0].idUsuario;
      });
      return;
    }

    if (operarioUnico?.disponible) {
      setIdSeleccionado(operarioUnico.idUsuario);
      return;
    }

    setIdSeleccionado("");
  }, [enabled, isLoading, showPicker, disponibles, operarioUnico]);

  const idAsignado = useMemo(() => {
    if (isLoading || !enabled) return null;
    if (showPicker) return idSeleccionado || null;
    if (operarioUnico?.disponible) return operarioUnico.idUsuario;
    return null;
  }, [
    enabled,
    idSeleccionado,
    isLoading,
    operarioUnico,
    showPicker,
  ]);

  const blockReason = useMemo(() => {
    if (!enabled) return null;
    if (isLoading) return null;
    if (loadError) return loadError;
    if (operarios.length === 0) {
      return "No hay operarios asignados a esta bodega.";
    }
    if (multiples && disponibles.length === 0) {
      return "Ningún operario tiene sesión activa. Espera a que un operario inicie sesión.";
    }
    if (operarioUnico && !operarioUnico.disponible) {
      return "El operario no tiene sesión activa.";
    }
    if (showPicker && !idSeleccionado) {
      return "Selecciona un operario.";
    }
    return null;
  }, [
    disponibles.length,
    enabled,
    idSeleccionado,
    isLoading,
    loadError,
    multiples,
    operarioUnico,
    operarios.length,
    showPicker,
  ]);

  const canAssign = Boolean(idAsignado) && !blockReason;

  return {
    operarios,
    disponibles,
    showPicker,
    idSeleccionado,
    setIdSeleccionado,
    idAsignado,
    canAssign,
    blockReason,
    isLoading,
    loadError,
    operarioUnico,
  };
}
