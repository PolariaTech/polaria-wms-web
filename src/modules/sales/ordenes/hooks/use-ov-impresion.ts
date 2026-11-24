import { useRef, useState } from "react";
import type { OvAccionesCtx } from "../components/pages/ov-impresion-ctx";
import type { BusyAction } from "../components/pages/ov-impresion-feedback";
import { useOvEjecutarImpresion } from "./use-ov-ejecutar-impresion";
import { useOvLoadPrintSheets } from "./use-ov-load-print-sheets";
import { useOvReintentarEnvio } from "./use-ov-reintentar-envio";
import { useOvSeleccionPdf } from "./use-ov-seleccion-pdf";

export type UseOvImpresionArgs = Omit<
  OvAccionesCtx,
  "printingLockRef" | "setBusyAction"
> & { zonaHoraria: string };

/** Impresión de OV: estado ocupado, hojas, imprimir, reintentar, elegir OT y previsualizar. */
export function useOvImpresion({ zonaHoraria, ...base }: UseOvImpresionArgs) {
  const printingLockRef = useRef(false);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);

  const loadPrintSheets = useOvLoadPrintSheets({
    codigoCuenta: base.codigoCuenta,
    runScoped: base.runScoped,
    zonaHoraria,
  });
  const executePrint = useOvEjecutarImpresion(
    { ...base, printingLockRef, setBusyAction },
    loadPrintSheets,
  );
  const reintentarEnvio = useOvReintentarEnvio(
    { ...base, printingLockRef, setBusyAction },
    executePrint,
  );
  const seleccionPdf = useOvSeleccionPdf(
    { ...base, printingLockRef, setBusyAction },
    loadPrintSheets,
  );

  return {
    busyAction,
    setBusyAction,
    printingLockRef,
    loadPrintSheets,
    executePrint,
    reintentarEnvio,
    ...seleccionPdf,
  };
}
