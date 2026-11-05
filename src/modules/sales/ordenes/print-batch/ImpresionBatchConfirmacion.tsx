"use client";

import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { diaEntregaDeOv, type ResumenOvBatch } from "./batch-seleccion";

interface ImpresionBatchConfirmacionProps {
  open: boolean;
  hojas: number;
  /** OV en el orden en que salen en el PDF. */
  orden: readonly ResumenOvBatch[];
  /** Nombre de la impresora de la cuenta; vacío mientras se consulta. */
  impresora: string | null;
  imprimiendo: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Último chequeo antes de enviar: qué sale, en qué orden y a dónde. */
export function ImpresionBatchConfirmacion({
  open,
  hojas,
  orden,
  impresora,
  imprimiendo,
  onClose,
  onConfirm,
}: ImpresionBatchConfirmacionProps) {
  return (
    <PolariaConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="¿Imprimir esta selección?"
      description={`Se enviarán ${hojas} ${hojas === 1 ? "hoja" : "hojas"} de ${orden.length} OV a ${impresora ?? "la impresora de la cuenta"}, en este orden.`}
      confirmLabel="Imprimir"
      isSubmitting={imprimiendo}
      size="lg"
    >
      <ol className="polaria-scrollbar max-h-64 divide-y divide-polaria-w-08 overflow-y-auto rounded-xl border border-polaria-w-08">
        {orden.map((item, indice) => {
          const dia = diaEntregaDeOv(item.row);
          return (
            <li
              key={item.row.idOrdenVenta}
              className="flex items-baseline justify-between gap-4 px-3 py-2"
            >
              <span className="min-w-0 truncate">
                <span className="mr-2 tabular-nums text-polaria-w">{indice + 1}.</span>
                <span className="font-semibold tabular-nums">{item.row.venta}</span>
                <span className="text-polaria-w"> · {item.row.comprador}</span>
              </span>
              <span className="shrink-0 tabular-nums text-polaria-w">
                {dia ? `${dia.slice(8)}/${dia.slice(5, 7)} · ` : ""}OT {item.ots.join(", ")}
              </span>
            </li>
          );
        })}
      </ol>
    </PolariaConfirmDialog>
  );
}
