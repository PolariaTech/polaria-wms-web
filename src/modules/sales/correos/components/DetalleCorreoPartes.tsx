"use client";

import { CheckCircle2, MailX, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import { estadoDelIngreso } from "../utils/estado-ingreso";
import {
  formatearFechaCompleta,
  separarAdjuntos,
  separarDirecciones,
} from "../utils/correos-formato";

const SIN_DATO = <span className="text-polaria-w-50">—</span>;

export function Personas({ valor }: { valor: string | null }) {
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

const SEGURIDAD: Record<NonNullable<CorreoFila["confianza"]>, string> = {
  alta: "alta",
  media: "media",
  baja: "baja",
};

/** Título del veredicto según lo que se le dice al operador en la columna «Ingreso». */
function tituloDelVeredicto(fila: CorreoFila): { texto: string; atencion: boolean } {
  const estado = estadoDelIngreso(fila);
  if (estado.tipo === "ingresado") {
    const codigos = estado.codigos.join(", ");
    return { texto: codigos ? `Ingresado como ${codigos}` : "Ingresado", atencion: false };
  }
  if (estado.tipo === "procesando") {
    return { texto: "El flujo lo está procesando", atencion: false };
  }
  if (estado.tipo === "ingresar") {
    if (estado.aviso === "duplicado") {
      return { texto: "Ya había una orden con ese número", atencion: true };
    }
    if (estado.aviso === "flujoFallo") {
      return { texto: "El flujo no pudo ingresarlo", atencion: true };
    }
    if (estado.aviso === "sinProcesar") return { texto: "Sin procesar", atencion: true };
    if (fila.nuevoPedido === false) return { texto: "Descartado por el flujo", atencion: true };
    return { texto: "Sin ingresar", atencion: true };
  }
  // «ingresando» (a mano, en curso) y «porElFlujo»: el título de siempre según el filtro del flujo.
  return fila.nuevoPedido === false
    ? { texto: "Descartado por el flujo", atencion: true }
    : { texto: "Ingresado por Mateo", atencion: false };
}

/** Lo que dijo el flujo y por qué: es lo que decide si hace falta ingresarlo a mano. */
export function VeredictoFlujo({ fila }: { fila: CorreoFila }) {
  const { texto, atencion } = tituloDelVeredicto(fila);
  const Icono = atencion ? MailX : CheckCircle2;
  const color = atencion ? "text-polaria-warning" : "text-polaria-teal";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        atencion
          ? "border-polaria-warning-border bg-polaria-warning-bg"
          : "border-polaria-t-20 bg-polaria-t-08",
      )}
    >
      <Icono className={cn("mt-0.5 h-5 w-5 shrink-0", color)} strokeWidth={1.75} aria-hidden />
      <div className="min-w-0">
        <p className={cn("polaria-text-body font-semibold", color)}>{texto}</p>
        {fila.motivo ? (
          <p className="polaria-text-body-sm mt-1 max-w-prose">{fila.motivo}</p>
        ) : fila.nuevoPedido === false ? (
          <p className="polaria-text-body-sm mt-1 text-polaria-w-50">
            El flujo no dejó un motivo.
          </p>
        ) : null}
        {fila.confianza ? (
          <p className="polaria-text-body-sm mt-1 text-polaria-w-50">
            Seguridad del clasificador: {SEGURIDAD[fila.confianza]}
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

/** Cuándo entró el correo al sistema: lo único que el usuario necesita de su registro interno. */
export function RegistroDelCorreo({ fila }: { fila: CorreoFila }) {
  if (!fila.registradoEn) return null;
  return (
    <p className="polaria-text-caption border-t border-polaria-w-08 pt-4 text-polaria-w-50">
      Registrado el {formatearFechaCompleta(fila.registradoEn)}
    </p>
  );
}
