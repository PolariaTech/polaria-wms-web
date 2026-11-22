"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import {
  describirEspera,
  type RangoEspera,
} from "../../utils/ot/aplicar-correccion-correo";
import { PoloWorking } from "./PoloWorking";

const BOTON_SECUNDARIO = cn(
  "min-h-11 rounded-xl border border-polaria-w-08 px-5 py-2.5",
  "text-sm font-medium text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** «Cancelar» de la capa de carga: al pasar el cursor se vuelve rojo con letra blanca. */
const BOTON_CANCELAR_PROCESO = cn(
  "min-h-11 rounded-xl border border-polaria-w-08 px-5 py-2.5",
  "text-sm font-medium text-polaria-w transition-colors duration-150 lg:text-base",
  "hover:border-red-600 hover:bg-red-600 hover:text-polaria-w",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** «Sí, cancelar» de la confirmación: rojo desde el inicio. */
const BOTON_CONFIRMAR_CANCELAR = cn(
  "min-h-11 rounded-xl bg-red-600 px-5 py-2.5",
  "text-sm font-semibold text-polaria-w transition-colors duration-150 hover:bg-red-700 lg:text-base",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

const suscribirNada = () => () => {};

function useEnNavegador(): boolean {
  return useSyncExternalStore(
    suscribirNada,
    () => true,
    () => false,
  );
}

/**
 * Estado de carga de la IA como capa sobre el modal (portal a `body`).
 */
export function CargaConPolo({
  titulo,
  detalle,
  espera,
  onCancelar,
}: {
  titulo: string;
  detalle?: string;
  espera: RangoEspera;
  onCancelar?: () => void;
}) {
  const enNavegador = useEnNavegador();
  const tituloId = useId();
  const preguntaId = useId();
  const [confirmando, setConfirmando] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const seguirRef = useRef<HTMLButtonElement>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enNavegador) return;
    (confirmando ? seguirRef.current : (botonRef.current ?? dialogoRef.current))?.focus();
  }, [enNavegador, confirmando]);

  useEffect(() => {
    if (!enNavegador || !onCancelar) return;
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      evento.stopPropagation();
      setConfirmando((actual) => !actual);
    };
    document.addEventListener("keydown", alPulsarTecla, true);
    return () => document.removeEventListener("keydown", alPulsarTecla, true);
  }, [enNavegador, onCancelar]);

  if (!enNavegador) return null;

  const retenerFoco = (evento: React.KeyboardEvent) => {
    if (evento.key !== "Tab") return;
    evento.preventDefault();
    const botones = Array.from(
      dialogoRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    if (botones.length === 0) {
      dialogoRef.current?.focus();
      return;
    }
    const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
    const paso = evento.shiftKey ? -1 : 1;
    botones[(actual + paso + botones.length) % botones.length]!.focus();
  };

  return createPortal(
    <div
      onKeyDown={retenerFoco}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-polaria-bg/85 p-4 backdrop-blur-md"
    >
      <div
        ref={dialogoRef}
        role={confirmando ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={confirmando ? preguntaId : undefined}
        tabIndex={-1}
        className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-polaria-t-20 bg-polaria-bg px-8 pt-6 pb-7 text-center outline-none"
      >
        <PoloWorking />
        <div
          role="status"
          aria-live="polite"
          className="mt-3 flex flex-col items-center gap-1"
        >
          <p
            id={tituloId}
            className="text-base font-semibold text-polaria-w lg:text-lg"
          >
            {titulo}
          </p>
          {detalle ? (
            <p className="max-w-[32ch] text-sm leading-relaxed text-balance break-words text-polaria-w-50 lg:text-base">
              {detalle}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
            {describirEspera(espera)}
          </p>
        </div>
        {onCancelar ? (
          confirmando ? (
            <div className="mt-5 flex w-full flex-col items-center gap-3 border-t border-polaria-w-08 pt-5">
              <p
                id={preguntaId}
                className="text-base font-semibold text-polaria-w lg:text-lg"
              >
                ¿Seguro que quieres cancelar este proceso?
              </p>
              <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
                Se descartará lo que se haya leído hasta ahora.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  ref={seguirRef}
                  type="button"
                  className={BOTON_SECUNDARIO}
                  onClick={() => setConfirmando(false)}
                >
                  Seguir esperando
                </button>
                <button
                  type="button"
                  className={BOTON_CONFIRMAR_CANCELAR}
                  onClick={onCancelar}
                >
                  Sí, cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              ref={botonRef}
              type="button"
              onClick={() => setConfirmando(true)}
              className={cn(BOTON_CANCELAR_PROCESO, "mt-5")}
            >
              Cancelar
            </button>
          )
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
