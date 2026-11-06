"use client";

import { useEffect, useState } from "react";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import type { ResumenOvBatch } from "./batch-seleccion";
import { ImpresionBatchConfirmacion } from "./ImpresionBatchConfirmacion";

interface ImpresionRapidaConfirmacionProps {
  open: boolean;
  hojas: number;
  /** OV en el orden en que salen en el PDF. */
  orden: readonly ResumenOvBatch[];
  impresora: string | null;
  imprimiendo: boolean;
  /** En cuántos envíos va el paquete (más de uno cuando pesa más del límite de un correo). */
  partes?: number;
  /** Minutos de pausa entre envíos; 0 si la impresora encola sola. */
  esperaMinutos?: number;
  onClose: () => void;
  onConfirm: () => void;
}

/** «Se mandará en 4 partes, una cada minuto (unos 3 min). No cierres esta pestaña hasta que termine.» */
function frasePartes(partes: number, esperaMinutos: number): string {
  if (partes <= 1) return "";
  const cadencia = esperaMinutos > 0 ? `, una cada ${esperaMinutos === 1 ? "minuto" : `${esperaMinutos} minutos`}` : "";
  const duracion = esperaMinutos > 0 ? ` (unos ${(partes - 1) * esperaMinutos} min)` : "";
  return `Se mandará en ${partes} partes${cadencia}${duracion}. No cierres esta pestaña hasta que termine.`;
}

/**
 * Doble confirmación de la Impresión rápida (daily del 2026-11-05): primero se ve qué sale y en
 * qué orden; después se vuelve a pedir, ya con el número de hojas en el título, para que nadie
 * mande 300 hojas sin darse cuenta.
 */
export function ImpresionRapidaConfirmacion({
  open,
  hojas,
  orden,
  impresora,
  imprimiendo,
  partes = 1,
  esperaMinutos = 0,
  onClose,
  onConfirm,
}: ImpresionRapidaConfirmacionProps) {
  const [paso, setPaso] = useState<1 | 2>(1);

  // Cada vez que se abre se empieza por el primer paso.
  useEffect(() => {
    if (open) setPaso(1);
  }, [open]);

  const palabra = hojas === 1 ? "hoja" : "hojas";
  const detalle = frasePartes(partes, esperaMinutos);

  if (paso === 1) {
    return (
      <ImpresionBatchConfirmacion
        open={open}
        hojas={hojas}
        orden={orden}
        impresora={impresora}
        imprimiendo={false}
        detalle={detalle}
        onClose={onClose}
        onConfirm={() => setPaso(2)}
      />
    );
  }

  return (
    <PolariaConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`¿Seguro que quieres imprimir ${hojas} ${palabra}?`}
      description={`Son ${orden.length} OV para ${impresora ?? "la impresora de la cuenta"}. ${detalle || "Una vez enviadas no se pueden recoger de la cola desde aquí."}`}
      confirmLabel={`Sí, imprimir ${hojas} ${palabra}`}
      isSubmitting={imprimiendo}
    />
  );
}
