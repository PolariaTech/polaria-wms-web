"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { armarPartePdf, nombreArchivoParte } from "./armar-parte-pdf";
import { partesDe } from "./enviar-paquete";
import type { PreviaBatch } from "./utilidades-batch";

interface ImpresionBatchDescargaPartesProps {
  previa: PreviaBatch;
  codigoCuenta: string;
  /** Mientras se envía a la impresora no se descarga. */
  deshabilitado?: boolean;
}

const BOTON =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5 text-sm font-semibold tabular-nums text-polaria-w transition hover:border-polaria-teal hover:bg-polaria-t-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg disabled:cursor-not-allowed disabled:opacity-60 [@media(max-height:50rem)]:min-h-9 [@media(max-height:50rem)]:py-1.5";

function guardarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Un botón por parte del paquete: cuando el PDF pesa demasiado se manda en varios envíos y cada uno
 * se puede bajar por separado, con el mismo contenido que recibiría la impresora.
 */
export function ImpresionBatchDescargaPartes({ previa, codigoCuenta, deshabilitado }: ImpresionBatchDescargaPartesProps) {
  const [bajando, setBajando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const partes = partesDe(previa);

  async function descargar(indice: number): Promise<void> {
    setBajando(indice);
    setError(null);
    try {
      const blob = await armarPartePdf({
        parte: partes[indice]!,
        indice,
        total: partes.length,
        resumenPdf: previa.resumenPdf,
        codigoCuenta,
      });
      guardarArchivo(blob, nombreArchivoParte(previa.nombreArchivo, indice, partes.length));
    } catch {
      setError(`No se pudo preparar la parte ${indice + 1}. Vuelve a intentarlo.`);
    } finally {
      setBajando(null);
    }
  }

  return (
    <div role="group" aria-label="Descargar el PDF por partes" className="flex flex-wrap items-center gap-2">
      {partes.map((_, indice) => (
        <button
          key={indice}
          type="button"
          onClick={() => void descargar(indice)}
          disabled={deshabilitado || bajando !== null}
          className={cn(BOTON)}
        >
          {bajando === indice ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden />
          ) : (
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          )}
          {bajando === indice ? "Preparando…" : `Descargar parte ${indice + 1} de ${partes.length}`}
        </button>
      ))}
      <p role="status" className="polaria-text-body-sm w-full text-polaria-danger empty:hidden">
        {error}
      </p>
    </div>
  );
}
