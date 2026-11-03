"use client";

import { CheckCircle2, MailX, Paperclip } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import {
  formatearFechaCompleta,
  separarAdjuntos,
  separarDirecciones,
} from "../utils/correos-formato";

const SIN_DATO = <span className="text-polaria-w-50">—</span>;
const dato = (valor: string | null): ReactNode => valor ?? SIN_DATO;

function Personas({ valor }: { valor: string | null }) {
  const personas = separarDirecciones(valor);
  if (personas.length === 0) return SIN_DATO;
  return (
    <ul className="space-y-1">
      {personas.map((persona, indice) => (
        <li key={`${persona.correo}-${indice}`} className="break-words">
          {persona.nombre ? (
            <>
              <span className="font-medium">{persona.nombre}</span>{" "}
              <span className="text-polaria-w-50">{persona.correo}</span>
            </>
          ) : (
            <span>{persona.correo}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function FichasDeAdjuntos({ nombres }: { nombres: string[] }) {
  if (nombres.length === 0) return <span className="polaria-text-body-sm">{SIN_DATO}</span>;
  return (
    <ul className="flex flex-wrap gap-2">
      {nombres.map((nombre, indice) => (
        <li
          key={`${nombre}-${indice}`}
          className="polaria-text-body-sm inline-flex max-w-full items-center gap-1.5 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-2.5 py-1"
        >
          <Paperclip
            className="h-3.5 w-3.5 shrink-0 text-polaria-w-50"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="min-w-0 break-all">{nombre}</span>
        </li>
      ))}
    </ul>
  );
}

/** Lo que dijo el flujo y por qué: es lo que decide si hace falta ingresarlo a mano. */
export function VeredictoFlujo({ fila }: { fila: CorreoFila }) {
  const descartado = fila.nuevoPedido === false;
  const Icono = descartado ? MailX : CheckCircle2;
  const color = descartado ? "text-polaria-warning" : "text-polaria-teal";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        descartado
          ? "border-polaria-warning-border bg-polaria-warning-bg"
          : "border-polaria-t-20 bg-polaria-t-08",
      )}
    >
      <Icono className={cn("mt-0.5 h-5 w-5 shrink-0", color)} strokeWidth={1.75} aria-hidden />
      <div className="min-w-0">
        <p className={cn("polaria-text-body font-semibold", color)}>
          {descartado ? "Descartado por el flujo" : "Ingresado por el flujo"}
        </p>
        {fila.motivo ? (
          <p className="polaria-text-body-sm mt-1 max-w-prose">{fila.motivo}</p>
        ) : descartado ? (
          <p className="polaria-text-body-sm mt-1 text-polaria-w-50">
            El flujo no dejó un motivo.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** De, Para y Adjuntos, como en un cliente de correo. */
export function ParticipantesDelCorreo({ fila }: { fila: CorreoFila }) {
  const adjuntos = separarAdjuntos(fila.adjunto);
  return (
    <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3">
      <dt className="polaria-text-body-sm pt-0.5 text-polaria-w-50">De</dt>
      <dd className="polaria-text-body-sm min-w-0">
        <Personas valor={fila.de} />
      </dd>
      <dt className="polaria-text-body-sm pt-0.5 text-polaria-w-50">Para</dt>
      <dd className="polaria-text-body-sm min-w-0">
        <Personas valor={fila.para} />
      </dd>
      <dt className="polaria-text-body-sm pt-1 text-polaria-w-50">
        {adjuntos.length > 1 ? "Adjuntos" : "Adjunto"}
      </dt>
      <dd className="min-w-0">
        <FichasDeAdjuntos nombres={adjuntos} />
      </dd>
    </dl>
  );
}

/** Etiqueta chica arriba y el valor debajo: para los datos de referencia de n8n. */
function Campo({
  etiqueta,
  children,
  tecnico = false,
}: {
  etiqueta: string;
  children: ReactNode;
  /** Identificadores: tipografía de datos, para leerlos y copiarlos sin confundir caracteres. */
  tecnico?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="polaria-text-caption text-polaria-w-50">{etiqueta}</dt>
      <dd
        className={cn(
          "mt-0.5 break-all",
          tecnico ? "font-mono text-xs tabular-nums" : "polaria-text-body-sm",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/** Los datos de referencia que guarda la data table de n8n, en pequeño y al final. */
export function DatosDeN8n({ fila }: { fila: CorreoFila }) {
  return (
    <section className="border-t border-polaria-w-08 pt-4">
      <h3 className="polaria-text-body-sm font-semibold text-polaria-w-50">Datos de n8n</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Campo etiqueta="ID del mensaje" tecnico>
          {fila.messageId}
        </Campo>
        <Campo etiqueta="ID del hilo" tecnico>
          {dato(fila.hilo)}
        </Campo>
        <Campo etiqueta="Registro en n8n" tecnico>
          {dato(fila.idRegistro)}
        </Campo>
        <Campo etiqueta="Registrado en n8n">
          {formatearFechaCompleta(fila.registradoEn)}
        </Campo>
        <Campo etiqueta="Última actualización">
          {formatearFechaCompleta(fila.actualizadoEn)}
        </Campo>
      </dl>
    </section>
  );
}
