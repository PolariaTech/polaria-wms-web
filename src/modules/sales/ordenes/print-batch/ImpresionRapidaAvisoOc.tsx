import { avisoDeOcSinImprimir } from "./aviso-oc";
import { ImpresionBatchMensaje } from "./ImpresionBatchMensaje";
import type { PreviaBatch } from "./utilidades-batch";

/** Avisa, arriba de la vista previa, qué OV salen sin su orden de compra (REQ-260). Sin nada que avisar no pinta nada. */
export function ImpresionRapidaAvisoOc({ previa }: { previa: Pick<PreviaBatch, "resumenPdf" | "partes"> }) {
  const aviso = avisoDeOcSinImprimir(previa);
  if (!aviso) return null;
  return (
    <ImpresionBatchMensaje tipo="aviso">
      <strong className="font-semibold">{aviso.titulo}</strong> {aviso.detalle}
    </ImpresionBatchMensaje>
  );
}
