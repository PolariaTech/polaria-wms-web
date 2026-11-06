import {
  buildOrdenTareaAlmacenLandscapePdfBlob,
  printOrdenTareaAlmacenLandscape,
} from "../print/download-orden-tarea-almacen-pdf";
import { numerarBlobPdf } from "../print/numerar-hojas-pdf";
import { MENSAJE_VERSION_NUEVA, esErrorDeVersionVieja } from "../print/print-correo-fallo";
import type { SilentPrintResult } from "../print/print-silent-cuenta";
import {
  enviarPorPartes,
  ESPERA_ENTRE_PARTES_MS,
  type FaseEnvio,
  type ResultadoEnvioPartes,
} from "./enviar-por-partes";
import { imprimirPdfListo } from "./imprimir-pdf-listo";
import type { ParteEnvio } from "./partir-paquete";
import { registrarImpresionBatch } from "./registrar-impresion-batch";
import type { PreviaBatch } from "./utilidades-batch";

/**
 * Solo la impresora por correo (o Epson Connect) necesita pausa: ahí la app no ve la cola y los
 * correos juntos pueden saturarla. IPP y QZ Tray encolan por su cuenta. Sin saber el modo se espera.
 */
export function esperaEntrePartes(modoEnvio: string | null | undefined): number {
  const sinCola = modoEnvio === "ipp" || modoEnvio === "agente" || modoEnvio === "sistema_local" || modoEnvio === "raw_9100";
  return sinCola ? 0 : ESPERA_ENTRE_PARTES_MS;
}

/**
 * Mensaje cuando el envío se detuvo por un fallo. Si el paquete iba en varias partes dice cuántas
 * salieron y cuál falló, y aclara que reintentar retoma desde esa sin repetir las anteriores.
 */
export function mensajeDeFallo(error: unknown, salieron: number, total: number): string {
  const motivo = esErrorDeVersionVieja(error)
    ? MENSAJE_VERSION_NUEVA
    : error instanceof Error
      ? error.message
      : "No se pudo enviar a la impresora.";
  return total > 1
    ? `Salieron ${salieron} de ${total} partes. Falló la parte ${salieron + 1}: ${motivo} Al volver a imprimir se retoma desde esa parte, sin repetir las que ya salieron.`
    : motivo;
}

/** Las partes de la vista previa; sin partición, todo es una sola. */
export function partesDe(previa: Pick<PreviaBatch, "hojas" | "resumen" | "partes">): ParteEnvio[] {
  return previa.partes ?? [{ hojas: previa.hojas, resumen: previa.resumen }];
}

/**
 * Manda el paquete parte por parte desde `desde`. La primera lleva el resumen; cada correo se
 * nombra «OV … (2/5)»; y el log de «impreso» se escribe solo de las OV de cada parte que salió, para
 * que una parte fallida no quede marcada como impresa y la impresión rápida la vuelva a tomar.
 */
export function enviarPaquete(input: {
  previa: PreviaBatch;
  codigoCuenta: string;
  desde: number;
  esperaMs: number;
  alCambiar?: (indice: number, total: number, fase: FaseEnvio, segundosRestantes?: number) => void;
  cancelado?: () => boolean;
}): Promise<ResultadoEnvioPartes<SilentPrintResult>> {
  const { previa, codigoCuenta, desde, esperaMs, alCambiar, cancelado } = input;
  const partes = partesDe(previa);
  return enviarPorPartes<SilentPrintResult>({
    partes,
    desde,
    esperaMs,
    alCambiar,
    cancelado,
    enviar: async (parte, indice) => {
      const etiquetaParte = partes.length > 1 ? `${indice + 1}/${partes.length}` : undefined;
      const nombreTrabajo = `OV ${parte.resumen[0]?.row.venta || "Polaria"}${etiquetaParte ? ` (${etiquetaParte})` : ""}`;
      let enviado: SilentPrintResult;
      if (parte.pdf) {
        // Con OC el PDF de la parte ya viene armado (resumen, OT y OC, numerado): se manda tal cual.
        enviado = await imprimirPdfListo(parte.pdf, { codigoCuenta, nombreTrabajo });
      } else if (previa.resumenPdf) {
        // Impresión rápida sin OC: el PDF se arma aquí para numerar sus hojas («Hoja N de M»), a las
        // que remite «Desde la hoja» del resumen. El resumen va solo en la primera parte.
        const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(parte.hojas, {
          codigoCuenta,
          resumen: indice === 0 ? previa.resumenPdf : undefined,
        });
        enviado = await imprimirPdfListo(await numerarBlobPdf(blob, etiquetaParte), { codigoCuenta, nombreTrabajo });
      } else {
        // La impresión detallada no lleva resumen ni numera sus hojas.
        enviado = await printOrdenTareaAlmacenLandscape(parte.hojas, { codigoCuenta, resumen: undefined, etiquetaParte });
      }
      registrarImpresionBatch({ previa: parte, codigoCuenta, enviado });
      return enviado;
    },
  });
}
