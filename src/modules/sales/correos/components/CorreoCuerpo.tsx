"use client";

import { Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  armarDocumentoDelCorreo,
  tieneImagenesExternas,
} from "../utils/correos-formato";
import { BOTON_SECUNDARIO } from "./AccionIngreso";

function AvisoDeImagenes({ onMostrar }: { onMostrar: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-polaria-w-08 px-4 py-3">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Se bloquearon las imágenes de internet: al cargarlas, quien envió el correo sabría que
        se abrió.
      </p>
      <button type="button" onClick={onMostrar} className={BOTON_SECUNDARIO}>
        Mostrar imágenes
      </button>
    </div>
  );
}

/** Esquina superior derecha del recuadro; deja libre el borde donde va la barra de desplazamiento. */
function BotonDeFondo({ oscuro, onCambiar }: { oscuro: boolean; onCambiar: () => void }) {
  const Icono = oscuro ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onCambiar}
      aria-pressed={oscuro}
      aria-label={oscuro ? "Usar fondo blanco" : "Usar modo oscuro de Polaria"}
      title={oscuro ? "Usar fondo blanco" : "Usar modo oscuro de Polaria"}
      className={cn(
        "absolute top-2 right-5 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
        oscuro
          ? "border-polaria-w-08 bg-polaria-bg/90 text-polaria-w hover:bg-polaria-bg"
          : "border-neutral-300 bg-white/90 text-neutral-700 hover:bg-white",
      )}
    >
      <Icono className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

/**
 * El mensaje del correo, dentro de un marco aislado: sin scripts, sin formularios, sin acceso a
 * esta página y con las imágenes de internet bloqueadas hasta que se pidan. El cuerpo de un
 * correo es contenido ajeno, nunca se inserta directo en la pantalla.
 */
export function CorreoCuerpo({
  html,
  texto,
  onCargado,
}: {
  html: string;
  texto: string;
  /** Avisa que el marco terminó de dibujar el mensaje. */
  onCargado?: () => void;
}) {
  const [permitirImagenes, setPermitirImagenes] = useState(false);
  const [oscuro, setOscuro] = useState(false);
  const documento = useMemo(
    () => armarDocumentoDelCorreo({ html, texto, permitirImagenes, oscuro }),
    [html, texto, permitirImagenes, oscuro],
  );
  const hayImagenesBloqueadas = !permitirImagenes && tieneImagenesExternas(html);

  return (
    <section>
      <h3 className="polaria-text-body font-semibold">Mensaje</h3>
      {hayImagenesBloqueadas ? (
        <AvisoDeImagenes onMostrar={() => setPermitirImagenes(true)} />
      ) : null}
      <div className="relative mt-3">
        <iframe
          title="Cuerpo del correo"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          srcDoc={documento}
          onLoad={onCargado}
          className={cn(
            "h-[70vh] min-h-96 w-full rounded-xl border border-polaria-w-08",
            oscuro ? "bg-polaria-bg" : "bg-white",
          )}
        />
        <BotonDeFondo oscuro={oscuro} onCambiar={() => setOscuro((actual) => !actual)} />
      </div>
    </section>
  );
}
