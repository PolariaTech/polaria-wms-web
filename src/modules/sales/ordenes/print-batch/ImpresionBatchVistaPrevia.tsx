"use client";

import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface ImpresionBatchVistaPreviaProps {
  blob: Blob;
  hojas: number;
  ot: number;
  ov: number;
  imprimiendo: boolean;
  /** Nombre del archivo al descargar. */
  nombreArchivo: string;
  /** Cómo se ordenó el PDF; la impresión rápida tiene su propia regla. */
  descripcionOrden?: string;
  /** Texto del botón para regresar a la pantalla anterior. */
  etiquetaVolver?: string;
  onVolver: () => void;
  onImprimir: () => void;
}

const BOTON_BASE =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg disabled:cursor-not-allowed disabled:opacity-60";

export function ImpresionBatchVistaPrevia({
  blob,
  hojas,
  ot,
  ov,
  imprimiendo,
  nombreArchivo,
  descripcionOrden = "ordenadas por fecha y hora de entrega",
  etiquetaVolver = "Volver a la selección",
  onVolver,
  onImprimir,
}: ImpresionBatchVistaPreviaProps) {
  const [url, setUrl] = useState<string | null>(null);

  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  // Al cambiar de vista el botón que se pulsó desaparece: el foco pasa al título de la nueva.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section aria-label="Vista previa de la impresión" className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            ref={titulo}
            tabIndex={-1}
            className="polaria-text-subtitle text-polaria-w outline-none"
          >
            Vista previa
          </h2>
          <p className="polaria-text-body-sm tabular-nums text-polaria-w">
            {ot} OT de {ov} OV · {hojas} {hojas === 1 ? "hoja" : "hojas"} · {descripcionOrden}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onVolver}
            disabled={imprimiendo}
            className={cn(
              BOTON_BASE,
              "border-polaria-w-08 text-polaria-w hover:bg-polaria-w-08",
            )}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {etiquetaVolver}
          </button>
          {url ? (
            <a
              href={url}
              download={nombreArchivo}
              aria-disabled={imprimiendo || undefined}
              className={cn(
                BOTON_BASE,
                "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:border-polaria-teal hover:bg-polaria-t-20",
                imprimiendo && "pointer-events-none opacity-60",
              )}
            >
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Descargar PDF
            </a>
          ) : null}
          <button
            type="button"
            onClick={onImprimir}
            disabled={imprimiendo}
            className={cn(
              BOTON_BASE,
              "border-polaria-teal bg-polaria-teal text-polaria-on-teal hover:opacity-90",
            )}
          >
            {imprimiendo ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden />
            ) : (
              <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )}
            {imprimiendo ? "Enviando…" : "Imprimir"}
          </button>
        </div>
      </div>

      {url ? (
        <iframe
          title="Vista previa del PDF con las órdenes de trabajo elegidas"
          src={url}
          className="min-h-[20rem] w-full flex-1 rounded-2xl border border-polaria-w-08 bg-polaria-bg"
        />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-polaria-w-08 text-polaria-w">
          Preparando el PDF…
        </div>
      )}
    </section>
  );
}
