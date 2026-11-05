"use client";

import { useLayoutEffect } from "react";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

/** REQ-170: ¿hay que tapar el formulario antes del primer paint de edición? */
export function debeBloquearPaintEdicion(input: {
  open: boolean;
  isEditing: boolean;
}): boolean {
  return input.open && input.isEditing;
}

/**
 * REQ-170: al abrir una OV en edición, bloquear el primer paint con datos
 * viejos o campos vacíos hasta que corra el bootstrap del formulario.
 */
export function useBloqueoPaintEdicionOv(estado: OrdenVentaFormEstado) {
  const {
    open,
    isEditing,
    editingId,
    setIsReadingIa,
    setFormDataReady,
    setIsLoading,
  } = estado;

  useLayoutEffect(() => {
    if (!debeBloquearPaintEdicion({ open, isEditing })) return;
    setIsReadingIa(true);
    setFormDataReady(false);
    setIsLoading(true);
  }, [
    editingId,
    isEditing,
    open,
    setFormDataReady,
    setIsLoading,
    setIsReadingIa,
  ]);
}
