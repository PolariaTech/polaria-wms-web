"use client";

import { useEffect, useRef } from "react";
import { POLARIA_FORM_INPUT_CLASS } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import {
  aplicarInstruccionFrecuente,
  INSTRUCCIONES_FRECUENTES_REAGRUPACION,
  ORDEN_GRUPOS_INSTRUCCION,
  TITULO_GRUPO_INSTRUCCION,
  tieneHuecosSinCompletar,
  type GrupoInstruccion,
} from "../../utils/ot/instrucciones-frecuentes-reagrupacion";
import {
  instruccionExcedeLimite,
  MENSAJE_INSTRUCCION_MUY_LARGA,
} from "../../utils/ot/reagrupacion-modal-estado";

interface Props {
  id: string;
  valor: string;
  /** Mientras carga o hay una propuesta, el campo no se edita. */
  bloqueado: boolean;
  /** Grupos de instrucciones modelo que este modal puede atender. */
  gruposDisponibles: readonly GrupoInstruccion[];
  placeholder: string;
  onCambio: (texto: string) => void;
}

const CHIP_CLASS = cn(
  "min-h-11 rounded-xl border border-polaria-w-20 px-4 py-2",
  "text-sm font-medium text-polaria-w transition lg:text-base",
  "hover:border-polaria-t-20 hover:bg-polaria-t-08 hover:text-polaria-teal",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-polaria-w-20 disabled:hover:bg-transparent disabled:hover:text-polaria-w",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
  "[@media(max-height:50rem)]:min-h-9 [@media(max-height:50rem)]:py-1",
);

/** Campo «Instrucción» del modal de reorganizar OT, con instrucciones modelo (REQ-300). */
export function ReagruparOtCampoInstruccion({
  id,
  valor,
  bloqueado,
  gruposDisponibles,
  placeholder,
  onCambio,
}: Props) {
  const campoRef = useRef<HTMLTextAreaElement>(null);
  /** Dónde dejar el cursor cuando React ya pintó el texto del modelo. */
  const seleccionPendiente = useRef<{ inicio: number; fin: number } | null>(null);

  useEffect(() => {
    const seleccion = seleccionPendiente.current;
    if (!seleccion) return;
    seleccionPendiente.current = null;
    campoRef.current?.focus();
    campoRef.current?.setSelectionRange(seleccion.inicio, seleccion.fin);
  }, [valor]);

  const grupos = ORDEN_GRUPOS_INSTRUCCION.filter((grupo) =>
    gruposDisponibles.includes(grupo),
  );
  const faltaCompletar = tieneHuecosSinCompletar(valor);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-medium text-polaria-w lg:text-lg">
        Instrucción
      </label>
      {grupos.length > 0 ? (
        <div className="flex flex-col gap-3 [@media(max-height:50rem)]:gap-2">
          <p className="text-sm text-polaria-w-50 lg:text-base">
            Elige un modelo y complétalo con lo que necesitas.
          </p>
          {grupos.map((grupo) => (
            <div
              key={grupo}
              role="group"
              aria-label={TITULO_GRUPO_INSTRUCCION[grupo]}
              className="flex flex-col gap-1.5"
            >
              <p className="text-sm font-medium text-polaria-w-50 lg:text-base">
                {TITULO_GRUPO_INSTRUCCION[grupo]}
              </p>
              <div className="flex flex-wrap gap-2">
                {INSTRUCCIONES_FRECUENTES_REAGRUPACION.filter(
                  (frecuente) => frecuente.grupo === grupo,
                ).map((frecuente) => (
                  <button
                    key={frecuente.id}
                    type="button"
                    disabled={bloqueado}
                    className={CHIP_CLASS}
                    onClick={() => {
                      const resultado = aplicarInstruccionFrecuente(valor, frecuente.texto);
                      seleccionPendiente.current = resultado.seleccion;
                      onCambio(resultado.valor);
                      // Si el texto no cambió (ya estaba), no hay re-render que mueva el cursor.
                      if (resultado.valor === valor) {
                        campoRef.current?.focus();
                        campoRef.current?.setSelectionRange(
                          resultado.seleccion.inicio,
                          resultado.seleccion.fin,
                        );
                        seleccionPendiente.current = null;
                      }
                    }}
                  >
                    {frecuente.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <textarea
        ref={campoRef}
        id={id}
        value={valor}
        readOnly={bloqueado}
        rows={6}
        placeholder={placeholder}
        onChange={(evento) => onCambio(evento.target.value)}
        className={cn(
          // Mismo borde, fondo y foco que el resto de los campos de la app.
          POLARIA_FORM_INPUT_CLASS,
          "min-h-[9rem] resize-y text-base leading-relaxed lg:min-h-[12rem] lg:text-[1.0625rem]",
          bloqueado && "opacity-70",
        )}
      />
      {faltaCompletar && !bloqueado ? (
        <p role="status" className="text-sm text-polaria-warning lg:text-base">
          Reemplaza lo que está entre corchetes para poder generar.
        </p>
      ) : null}
      {instruccionExcedeLimite(valor) ? (
        <p role="alert" className="text-sm text-polaria-danger lg:text-base">
          {MENSAJE_INSTRUCCION_MUY_LARGA}
        </p>
      ) : null}
    </div>
  );
}
