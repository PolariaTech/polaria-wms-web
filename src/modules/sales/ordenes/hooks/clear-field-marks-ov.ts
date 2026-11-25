"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CampoDiscrepancia } from "../utils/pedido/map-pedido-extraido-to-form";

const LABEL_POR_CAMPO: Record<string, string> = {
  centroConsumo: "Centro de consumo",
  direccion: "Dirección de entrega",
  anden: "Andén",
  contacto: "Contacto",
  telefono: "Teléfono",
  correo: "Correo",
  ventanaDesde: "Ventana desde",
  ventanaHasta: "Ventana hasta",
  ordenCompraHotel: "Orden de compra del cliente",
  observaciones: "Notas generales",
  fechaEntrega: "Fecha de entrega",
};

function normalizar(valor: string): string {
  return valor.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Quita marcas teal/amarillo al editar. Si el campo venía en amarillo (Mateo ≠ ficha)
 * y el operador lo cambia, registra Inicial (Mateo) / Definitivo (edición) para el
 * diálogo de confirmación. Sin edición manual no hay fila en ese diálogo.
 */
export function useClearFieldMarksOv(params: {
  warnFields: Set<string>;
  valoresActuales: Record<string, string>;
  setAutoFields: Dispatch<SetStateAction<Set<string>>>;
  setWarnFields: Dispatch<SetStateAction<Set<string>>>;
  setMissingFields: Dispatch<SetStateAction<Set<string>>>;
  setDiscrepancias: Dispatch<SetStateAction<CampoDiscrepancia[]>>;
}) {
  const {
    warnFields,
    valoresActuales,
    setAutoFields,
    setWarnFields,
    setMissingFields,
    setDiscrepancias,
  } = params;

  return useCallback(
    (field: string, valorNuevo?: string) => {
      const eraAmarilloMateo = warnFields.has(field);

      setAutoFields((prev) => {
        if (!prev.has(field)) return prev;
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
      setWarnFields((prev) => {
        if (!prev.has(field)) return prev;
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
      setMissingFields((prev) => {
        if (!prev.has(field)) return prev;
        const next = new Set(prev);
        next.delete(field);
        return next;
      });

      // Fecha / avisos de sistema: al editar se quita la discrepancia vieja.
      if (field === "fechaEntrega" || valorNuevo === undefined) {
        setDiscrepancias((prev) => {
          if (!prev.some((row) => row.fieldKey === field)) return prev;
          return prev.filter((row) => row.fieldKey !== field);
        });
        return;
      }

      setDiscrepancias((prev) => {
        const previaUsuario = prev.find(
          (row) =>
            row.fieldKey === field &&
            row.db !== "Hoy o posterior" &&
            row.db !== "Leída del correo",
        );
        const debeRegistrar =
          eraAmarilloMateo || Boolean(previaUsuario);
        if (!debeRegistrar) {
          if (!prev.some((row) => row.fieldKey === field)) return prev;
          return prev.filter((row) => row.fieldKey !== field);
        }

        const inicial =
          previaUsuario?.db?.trim() ||
          valoresActuales[field]?.trim() ||
          "—";
        const definitivo = valorNuevo.trim() || "—";
        if (normalizar(inicial) === normalizar(definitivo)) {
          return prev.filter((row) => row.fieldKey !== field);
        }

        const fila: CampoDiscrepancia = {
          campo: LABEL_POR_CAMPO[field] ?? field,
          fieldKey: field,
          db: inicial,
          ia: definitivo,
        };
        return [...prev.filter((row) => row.fieldKey !== field), fila];
      });
    },
    [
      warnFields,
      valoresActuales,
      setAutoFields,
      setWarnFields,
      setMissingFields,
      setDiscrepancias,
    ],
  );
}
