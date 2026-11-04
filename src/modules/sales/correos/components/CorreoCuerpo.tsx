"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
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

/**
 * Sin scripts, formularios ni ventanas con acceso a esta página. `allow-same-origin` solo deja que
 * esta página LEA el alto del mensaje para ajustar el recuadro: sin `allow-scripts` el mensaje no
 * puede ejecutar nada, y la política de contenido bloquea toda conexión.
 */
const SANDBOX_DEL_MENSAJE = "allow-same-origin allow-popups allow-popups-to-escape-sandbox";
/** Margen para una barra de desplazamiento horizontal dentro del marco. */
const HOLGURA_PX = 4;
const ALTO_MINIMO_MENSAJE_PX = 96;

/**
 * Alto que necesita el mensaje para verse completo. Se mide al cargar y cada vez que el cuerpo
 * cambia de tamaño (por ejemplo, cuando llegan las imágenes), para que el recuadro se ajuste.
 */
function useAltoDelContenido(marco: RefObject<HTMLIFrameElement | null>) {
  const [alto, setAlto] = useState<number | null>(null);
  const observador = useRef<ResizeObserver | null>(null);

  const medir = useCallback(() => {
    const cuerpo = marco.current?.contentDocument?.body;
    if (!cuerpo) return;
    setAlto(Math.max(ALTO_MINIMO_MENSAJE_PX, Math.ceil(cuerpo.offsetHeight) + HOLGURA_PX));
  }, [marco]);

  const alCargar = useCallback(() => {
    medir();
    observador.current?.disconnect();
    const cuerpo = marco.current?.contentDocument?.body;
    if (!cuerpo || typeof ResizeObserver === "undefined") return;
    observador.current = new ResizeObserver(medir);
    observador.current.observe(cuerpo);
  }, [marco, medir]);

  useEffect(() => () => observador.current?.disconnect(), []);
  return { alto, alCargar };
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
  const marco = useRef<HTMLIFrameElement | null>(null);
  const { alto, alCargar } = useAltoDelContenido(marco);
  const documento = useMemo(
    () => armarDocumentoDelCorreo({ html, texto, permitirImagenes, oscuro }),
    [html, texto, permitirImagenes, oscuro],
  );
  const hayImagenesBloqueadas = !permitirImagenes && tieneImagenesExternas(html);

  return (
    <section className="flex min-h-0 flex-col">
      <h3 className="polaria-text-body font-semibold">Mensaje</h3>
      {hayImagenesBloqueadas ? (
        <AvisoDeImagenes onMostrar={() => setPermitirImagenes(true)} />
      ) : null}
      {/* El recuadro mide lo que mide el mensaje; si no cabe en la ventana (o en 70 % apilado), se encoge y el mensaje se desplaza dentro. */}
      <div
        className="relative mt-3 max-h-[70vh] min-h-24 lg:max-h-none"
        style={{ flex: alto ? `0 1 ${alto}px` : "1 1 24rem" }}
      >
        <iframe
          ref={marco}
          title="Cuerpo del correo"
          sandbox={SANDBOX_DEL_MENSAJE}
          referrerPolicy="no-referrer"
          srcDoc={documento}
          onLoad={() => {
            alCargar();
            onCargado?.();
          }}
          className={cn(
            "absolute inset-0 h-full w-full rounded-xl border border-polaria-w-08",
            oscuro ? "bg-polaria-bg" : "bg-white",
          )}
        />
        <BotonDeFondo oscuro={oscuro} onCambiar={() => setOscuro((actual) => !actual)} />
      </div>
    </section>
  );
}
