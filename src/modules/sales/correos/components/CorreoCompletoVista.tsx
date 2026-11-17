"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { CargaConPolo } from "@/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel";
import type { RangoEspera } from "@/modules/sales/ordenes/utils/ot/aplicar-correccion-correo";
import { useCorreoCompleto } from "../hooks/useCorreoCompleto";
import { useFilaCorreo } from "../hooks/useFilaCorreo";
import type { AdjuntoCorreo, CorreoContenido, CorreoFila } from "../types/correos.types";
import { formatearFechaCompleta } from "../utils/correos-formato";
import { recordarCorreoAbierto } from "../utils/ultimo-correo-abierto";
import { BOTON_SECUNDARIO } from "./AccionIngreso";
import { AdjuntosDelCorreo } from "./AdjuntosDelCorreo";
import { BarraCorreoCompleto } from "./BarraCorreoCompleto";
import { CorreoCuerpo } from "./CorreoCuerpo";
import { Personas } from "./DetalleCorreoPartes";
import { IngresoDesdeCorreo } from "./IngresoDesdeCorreo";
import { VisorAdjuntoCorreo } from "./VisorAdjuntoCorreo";

/** Lo que suele tardar la primera lectura en Gmail; la siguiente, desde la memoria del api, es casi inmediata. */
const ESPERA_LECTURA_DEL_CORREO: RangoEspera = { minSeg: 3, maxSeg: 15 };

/** Tope para esperar a que el marco del mensaje termine de dibujar antes de mostrar todo. */
const PLAZO_DEL_CUERPO_MS = 5000;

/** Desde esta anchura (lg) los datos van a la izquierda y el mensaje a la derecha. */
const CONSULTA_DOS_COLUMNAS = "(min-width: 1024px)";
/** Lo que el shell deja debajo del contenido (su padding inferior de 2 rem). */
const MARGEN_INFERIOR_PX = 32;
const ALTO_MINIMO_PX = 420;

/**
 * Alto máximo del panel: lo que queda en la ventana desde donde empieza hasta su borde inferior,
 * para que la página no haga scroll y solo lo haga el mensaje. El panel mide lo que mide su
 * contenido y solo llega a este tope cuando el correo es más largo. En pantallas angostas devuelve null: se apila
 * y la página se desplaza como siempre. Se vuelve a medir al cambiar la ventana o el alto de la
 * página (por ejemplo, cuando el título pasa a ser el asunto y ocupa otra cantidad de líneas).
 */
function useAltoDisponible(panel: RefObject<HTMLElement | null>, remedir: unknown): number | null {
  const [alto, setAlto] = useState<number | null>(null);

  useEffect(() => {
    const elemento = panel.current;
    if (!elemento) return;
    const medir = () => {
      if (!window.matchMedia?.(CONSULTA_DOS_COLUMNAS).matches) {
        setAlto(null);
        return;
      }
      const arriba = elemento.getBoundingClientRect().top + window.scrollY;
      const disponible = Math.floor(window.innerHeight - arriba - MARGEN_INFERIOR_PX);
      setAlto(Math.max(ALTO_MINIMO_PX, disponible));
    };
    medir();
    window.addEventListener("resize", medir);
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    observador?.observe(document.body);
    return () => {
      window.removeEventListener("resize", medir);
      observador?.disconnect();
    };
  }, [panel, remedir]);

  return alto;
}

function EncabezadoDelCorreo({ correo }: { correo: CorreoContenido }) {
  return (
    <dl className="polaria-text-body-sm grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 gap-y-3">
      <dt className="pt-0.5 text-polaria-w-50">De</dt>
      <dd className="min-w-0">
        <Personas valor={correo.de || null} />
      </dd>
      <dt className="pt-0.5 text-polaria-w-50">Para</dt>
      <dd className="min-w-0">
        <Personas valor={correo.para || null} />
      </dd>
      <dt className="pt-0.5 text-polaria-w-50">Fecha</dt>
      <dd className="tabular-nums">
        {formatearFechaCompleta(correo.fecha)} · hora de Colombia
      </dd>
    </dl>
  );
}

function ErrorDeLectura({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3">
      <p className="polaria-text-body-sm text-polaria-danger">{mensaje}</p>
      <button type="button" onClick={onReintentar} className={BOTON_SECUNDARIO}>
        Reintentar
      </button>
    </div>
  );
}

interface ColumnasDelCorreoProps {
  messageId: string;
  fila: CorreoFila | null;
  fallo: boolean;
  error: string | null;
  reintentar: () => void;
  correo: CorreoContenido | null;
  hayCorreo: boolean;
  visor: AdjuntoCorreo | null;
  onVerAdjunto: (adjunto: AdjuntoCorreo) => void;
  onCerrarVisor: () => void;
  onCuerpoListo: () => void;
}

function ColumnasDelCorreo({
  messageId,
  fila,
  fallo,
  error,
  reintentar,
  correo,
  hayCorreo,
  visor,
  onVerAdjunto,
  onCerrarVisor,
  onCuerpoListo,
}: ColumnasDelCorreoProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
      <div className="flex min-h-0 flex-col gap-6 lg:w-[22rem] lg:shrink-0 lg:overflow-y-auto lg:pr-2">
        <IngresoDesdeCorreo fila={fila} fallo={fallo} />
        {error ? <ErrorDeLectura mensaje={error} onReintentar={reintentar} /> : null}
        {correo && hayCorreo ? (
          <>
            <EncabezadoDelCorreo correo={correo} />
            <AdjuntosDelCorreo
              messageId={messageId}
              adjuntos={correo.adjuntos}
              onVer={onVerAdjunto}
            />
          </>
        ) : null}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {correo && hayCorreo && visor ? (
          <VisorAdjuntoCorreo
            messageId={messageId}
            adjunto={visor}
            onCerrar={onCerrarVisor}
          />
        ) : null}
        {correo && hayCorreo && !visor ? (
          <CorreoCuerpo
            html={correo.html}
            texto={correo.texto}
            onCargado={onCuerpoListo}
          />
        ) : null}
      </div>
    </div>
  );
}

interface CorreoCompletoVistaProps {
  messageId: string;
  /** Avisa el asunto cuando el correo ya se muestra, para ponerlo como título de la pantalla. */
  onAsunto?: (asunto: string) => void;
}

/**
 * El correo completo tal como llegó (REQ-104). En pantallas anchas ocupa el alto de la ventana:
 * a la izquierda quién lo mandó y sus adjuntos, a la derecha el mensaje, que es lo único que
 * se desplaza y solo cuando no cabe. Se lee en Gmail al abrir la pantalla, por eso puede tardar un par de segundos.
 */
export function CorreoCompletoVista({ messageId, onAsunto }: CorreoCompletoVistaProps) {
  const { correo, error, cargando, reintentar } = useCorreoCompleto(messageId);
  const { fila, fallo, ingresar } = useFilaCorreo(messageId);
  const [cuerpoListo, setCuerpoListo] = useState(false);
  const [visor, setVisor] = useState<AdjuntoCorreo | null>(null);
  const panel = useRef<HTMLElement | null>(null);
  const alto = useAltoDisponible(panel, cuerpoListo);
  const hayCorreo = !cargando && correo !== null;
  const asunto = correo?.asunto || "Correo sin asunto";

  useEffect(() => {
    setCuerpoListo(false);
    setVisor(null);
  }, [messageId]);

  // Si el marco nunca avisara que cargó, no se deja a la persona esperando para siempre.
  useEffect(() => {
    if (!hayCorreo || cuerpoListo) return;
    const plazo = setTimeout(() => setCuerpoListo(true), PLAZO_DEL_CUERPO_MS);
    return () => clearTimeout(plazo);
  }, [hayCorreo, cuerpoListo]);

  useEffect(() => {
    if (cuerpoListo && hayCorreo) onAsunto?.(asunto);
  }, [cuerpoListo, hayCorreo, asunto, onAsunto]);

  useEffect(() => recordarCorreoAbierto(messageId), [messageId]);

  return (
    <section
      ref={panel}
      aria-label="Correo"
      aria-busy={!cuerpoListo}
      style={alto ? { maxHeight: alto } : undefined}
      className={cn(
        "flex flex-col gap-6",
        // Se arma mientras Polo sigue a la vista, para que la persona vea el correo ya completo.
        !cuerpoListo && !error && "invisible",
      )}
    >
      <BarraCorreoCompleto
        messageId={messageId}
        fila={fila}
        onIngresar={(id) => void ingresar(id)}
      />
      <ColumnasDelCorreo
        messageId={messageId}
        fila={fila}
        fallo={fallo}
        error={error}
        reintentar={reintentar}
        correo={correo}
        hayCorreo={hayCorreo}
        visor={visor}
        onVerAdjunto={setVisor}
        onCerrarVisor={() => setVisor(null)}
        onCuerpoListo={() => setCuerpoListo(true)}
      />
      {cuerpoListo || error ? null : (
        <CargaConPolo
          titulo="Abriendo el correo…"
          detalle={hayCorreo ? "Preparando el mensaje." : "Lo estamos leyendo en Gmail."}
          espera={ESPERA_LECTURA_DEL_CORREO}
        />
      )}
    </section>
  );
}

/** La pantalla completa: el título es el asunto del correo en cuanto se conoce. */
export function CorreoCompletoPantalla({ messageId }: { messageId: string }) {
  const [asunto, setAsunto] = useState<string | null>(null);
  return (
    <OperationalModuleShell
      title={asunto ?? "Correo completo"}
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <CorreoCompletoVista messageId={messageId} onAsunto={setAsunto} />
    </OperationalModuleShell>
  );
}
