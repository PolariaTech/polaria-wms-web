"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { ETIQUETA_RECARGAR_PAGINA } from "../../print/print-correo-fallo";

/** Lo que se le cuenta a la persona tras imprimir (REQ-039): salió bien, falló, o hay que recargar. */
export interface ResultadoImpresion {
  ok: boolean;
  title: string;
  lines: string[];
  /** Con valor, el aviso ofrece «Reintentar»; lo que reintenta lo decide `onReintentar`. */
  retry: unknown | null;
  /** REQ-189: pestaña con versión vieja; el botón recarga la página. */
  recargar?: boolean;
}

interface OvImpresionResultadoModalProps {
  resultado: ResultadoImpresion | null;
  /** Hay un envío en curso: no se puede reintentar encima. */
  ocupado: boolean;
  /** El envío en curso es una impresión: el botón dice «Reintentando…». */
  reintentando: boolean;
  onReintentar: () => void;
  onClose: () => void;
}

const BOTON_PRIMARIO =
  "w-full rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

export function OvImpresionResultadoModal({
  resultado,
  ocupado,
  reintentando,
  onReintentar,
  onClose,
}: OvImpresionResultadoModalProps) {
  if (!resultado) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ov-feedback-title"
        aria-describedby="ov-feedback-detail"
        className="polaria-card-glow relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl"
      >
        <div className="px-5 pb-3 pt-6 sm:px-6">
          <div className="flex flex-col items-center text-center">
            {resultado.ok ? (
              <CheckCircle2 className="h-12 w-12 text-polaria-teal" strokeWidth={1.75} aria-hidden />
            ) : (
              <XCircle className="h-12 w-12 text-polaria-danger" strokeWidth={1.75} aria-hidden />
            )}
            <h2 id="ov-feedback-title" className="mt-4 polaria-text-title font-semibold text-polaria-w">
              {resultado.title}
            </h2>
            <div id="ov-feedback-detail" className="mt-2 space-y-2 polaria-text-body-sm text-polaria-w-50">
              {resultado.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-polaria-w-08 px-5 py-4 sm:px-6">
          {resultado.recargar ? (
            <button type="button" onClick={() => window.location.reload()} className={BOTON_PRIMARIO}>
              {ETIQUETA_RECARGAR_PAGINA}
            </button>
          ) : resultado.retry ? (
            <button
              type="button"
              disabled={ocupado}
              onClick={onReintentar}
              className={`${BOTON_PRIMARIO} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {reintentando ? "Reintentando…" : "Reintentar"}
            </button>
          ) : (
            <button type="button" onClick={onClose} className={BOTON_PRIMARIO}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
