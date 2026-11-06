import { useAuthStore } from "@/stores/auth.store";
import type { SilentPrintResult } from "../print/print-silent-cuenta";
import { printQueueLogMensaje, printQueuePayload } from "../print/print-queue-status";
import { postOrdenVentaLogForOts } from "../services/orden-venta-log.client";
import type { PreviaBatch } from "./utilidades-batch";

/**
 * Deja en el log de cada OV que se imprimió, igual que la impresión de una sola OV: así la
 * advertencia de «ya se imprimió» (REQ-137) también ve lo que salió por el batch.
 */
export function registrarImpresionBatch(input: {
  previa: Pick<PreviaBatch, "hojas" | "resumen">;
  codigoCuenta: string;
  enviado: SilentPrintResult;
}): void {
  const { previa, codigoCuenta, enviado } = input;
  const session = useAuthStore.getState().session;
  for (const item of previa.resumen) {
    const propias = previa.hojas.filter((hoja) => hoja.idOrdenVenta === item.row.idOrdenVenta);
    void postOrdenVentaLogForOts({
      idOrdenVenta: item.row.idOrdenVenta,
      codigoCuenta,
      accion: "actualizacion",
      mensaje: printQueueLogMensaje({
        outcome: enviado.queue,
        impresora: enviado.impresora,
        autor: session?.nombre?.trim() || "usuario",
        auto: false,
      }),
      idUsuario: session?.idUsuario ?? null,
      autorNombre: session?.nombre ?? null,
      idBodega: item.row.idBodega ?? null,
      idOrdenesTrabajo: propias.map((hoja) => hoja.idOrdenTrabajo),
      payloadExtra: printQueuePayload({
        tipo: "impresion_pdf",
        hojas: propias.length,
        impresora: enviado.impresora,
        outcome: enviado.queue,
      }),
    });
  }
}
