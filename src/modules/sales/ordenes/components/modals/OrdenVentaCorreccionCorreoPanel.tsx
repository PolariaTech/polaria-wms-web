"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import {
  describirEspera,
  documentosSinVerificar,
  formatearImporte,
  puedeAplicarCorreccion,
  type DocumentoCorreccionApi,
  type PropuestaCorreccionCorreoApi,
  type RangoEspera,
} from "../../utils/ot/aplicar-correccion-correo";

const BOTON_SECUNDARIO = cn(
  "min-h-11 rounded-xl border border-polaria-w-08 px-5 py-2.5",
  "text-sm font-medium text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

const BOTON_PRIMARIO = cn(
  "inline-flex min-h-11 min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
  "text-sm font-semibold text-polaria-on-teal transition hover:opacity-90 lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** «Cancelar» de la capa de carga: al pasar el cursor se vuelve rojo con letra blanca. */
const BOTON_CANCELAR_PROCESO = cn(
  "min-h-11 rounded-xl border border-polaria-w-08 px-5 py-2.5",
  "text-sm font-medium text-polaria-w transition-colors duration-150 lg:text-base",
  // red-600 y no el token `danger` del tema oscuro: con letra blanca éste no llega a 4,5:1.
  "hover:border-red-600 hover:bg-red-600 hover:text-polaria-w",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** «Sí, cancelar» de la confirmación: rojo desde el inicio, porque ya es la acción destructiva. */
const BOTON_CONFIRMAR_CANCELAR = cn(
  "min-h-11 rounded-xl bg-red-600 px-5 py-2.5",
  "text-sm font-semibold text-polaria-w transition-colors duration-150 hover:bg-red-700 lg:text-base",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/**
 * Escena «Polo is working» de la marca (variante con planta), aprobada el 2026-10-23.
 * Fuente de verdad: D:\WORK\POLARIA\POLARIA_MARCA\marca\ilustraciones\escenas\
 * polaria-polo-working-planta-animado.svg (SHA-256 d46a05df9814bd6daab7484dc647e735987921a6d67adf7f449f48fc9335642a).
 * Se pinta como <img> para aislar sus ids y su CSS del documento; el reposo con
 * `prefers-reduced-motion` ya viene dentro del propio SVG. La marca pide no usarla por
 * debajo de ~64 px: aquí va a 224 px.
 */
const POLO_WORKING_PLANTA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 200"><style>@keyframes respira{0%,to{transform:translateY(0)}50%{transform:translateY(-1.92px)}}@keyframes lee{0%,12%,to{transform:translateX(0)}30%,42%{transform:translateX(-2.7px)}60%,72%{transform:translateX(2.7px)}}@keyframes mece{0%,to{transform:rotate(0)}25%{transform:rotate(1.6deg)}75%{transform:rotate(-1.6deg)}}#polo{animation:respira 2.6s ease-in-out infinite}#ojos{animation:lee 4s ease-in-out infinite}#hojas{transform-origin:52px 161px;animation:mece 4.4s ease-in-out infinite}@media (prefers-reduced-motion:reduce){#hojas,#ojos,#polo{animation:none}}</style><rect id="baldosa" width="270" height="200" fill="#020609" rx="44"/><g id="planta"><g id="hojas"><path fill="none" stroke="#f8f8f6" stroke-linecap="round" stroke-width="3" d="M52 161v-14"/><ellipse cx="44" cy="147" fill="#00e5cc" rx="5" ry="11" transform="rotate(-35 44 147)"/><ellipse cx="60" cy="147" fill="#00a591" rx="5" ry="11" transform="rotate(35 60 147)"/><ellipse cx="52" cy="141" fill="#00e5cc" rx="5" ry="12"/></g><path id="maceta" fill="#f8f8f6" d="M40 161h24l-3 14q-.5 2-2.5 2h-13q-2 0-2.5-2z"/></g><g transform="translate(50)"><g transform="matrix(1.3 0 0 1.3 20 20)"><g id="polo"><g id="cuerpo" fill="#00e5cc" stroke="#00e5cc" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="25" stroke="none"/><g id="lobulos" stroke-width="15"><g><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(60 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(120 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(180 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(240 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(300 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g></g><g id="puntos" stroke="none"><g transform="rotate(30 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(90 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(150 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(210 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(270 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(330 50 50)"><circle cx="50" cy="16" r="4"/></g></g></g><g transform="translate(0 3)"><g id="ojos" fill="#020609"><path id="ojo-izq" d="M35.3 48.2h10.4a5.5 5.5 0 1 1-10.4 0"/><path id="ojo-der" d="M54.3 48.2h10.4a5.5 5.5 0 1 1-10.4 0"/></g></g></g></g><g id="laptop"><rect id="tapa" width="110" height="62" x="30" y="108" fill="#f8f8f6" rx="3"/><g id="logo-tapa" fill="#020609" stroke="#020609" stroke-linecap="round" transform="matrix(.34 0 0 .34 68.5 122.5)"><circle cx="50" cy="50" r="25" stroke="none"/><g stroke-width="15"><line x1="50" x2="50" y1="50" y2="14"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(60 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(120 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(180 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(240 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(300 50 50)"/></g><g stroke="none"><circle cx="50" cy="16" r="4" transform="rotate(30 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(90 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(150 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(210 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(270 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(330 50 50)"/></g></g><rect id="base" width="126" height="4" x="22" y="173" fill="#f8f8f6" rx="2"/></g><g id="taza"><rect id="taza-cuerpo" width="20" height="24" x="156" y="153" fill="#f8f8f6" rx="5"/><path id="taza-asa" fill="none" stroke="#f8f8f6" stroke-linecap="round" stroke-width="4" d="M176 159h3a6 6 0 0 1 0 12h-3"/></g></g><line id="escritorio" x1="20" x2="250" y1="181" y2="181" stroke="#f8f8f6" stroke-linecap="round" stroke-width="4"/></svg>`;
/**
 * Se pinta SIN la baldosa de fondo (`#baldosa`, el rectángulo casi negro de la escena): la
 * carga vive sobre su propia tarjeta oscura y la baldosa se vería como una caja dentro de
 * otra. Lo demás de la escena queda idéntico.
 */
const POLO_WORKING_PLANTA_SIN_BALDOSA = POLO_WORKING_PLANTA_SVG.replace(
  /<rect id="baldosa"[^>]*\/>/,
  "",
);
const POLO_WORKING_PLANTA_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  POLO_WORKING_PLANTA_SIN_BALDOSA,
)}`;
/** Tema claro: la escena original, con su baldosa oscura, para que lo blanco (laptop, mesa) se lea. */
const POLO_WORKING_PLANTA_CON_BALDOSA_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  POLO_WORKING_PLANTA_SVG,
)}`;

/** Polo trabajando en su laptop; decorativo, el estado lo dice el texto de al lado. */
export function PoloWorking({ className }: { className?: string }) {
  const comun = cn("h-auto w-56 max-w-full select-none lg:w-64", className);
  return (
    <>
      {/* Tema oscuro: sin baldosa, la tarjeta ya es oscura. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG animado con su CSS propio; next/image lo aplanaría */}
      <img
        src={POLO_WORKING_PLANTA_SRC}
        alt=""
        width={224}
        height={166}
        decoding="async"
        className={cn(comun, '[html[data-theme="light"]_&]:hidden')}
        draggable={false}
      />
      {/* Tema claro: con su baldosa oscura. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG animado con su CSS propio; next/image lo aplanaría */}
      <img
        src={POLO_WORKING_PLANTA_CON_BALDOSA_SRC}
        alt=""
        width={224}
        height={166}
        decoding="async"
        className={cn(comun, 'hidden [html[data-theme="light"]_&]:block')}
        draggable={false}
      />
    </>
  );
}

const suscribirNada = () => () => {};

/** true solo en el navegador: el portal necesita `document` y no existe al renderizar en el servidor. */
function useEnNavegador(): boolean {
  return useSyncExternalStore(
    suscribirNada,
    () => true,
    () => false,
  );
}

/**
 * Estado de carga de la IA como capa independiente SOBRE el modal: Polo trabajando, qué
 * se está haciendo, lo que se entendió y cuánto suele tardar. Va en un portal a `body`
 * para que ningún ancestro con `transform` o `overflow` la recorte. Bloquea el fondo
 * mientras trabaja la IA y trae su propio «Cancelar» (el del modal queda tapado).
 */
export function CargaConPolo({
  titulo,
  detalle,
  espera,
  onCancelar,
}: {
  titulo: string;
  /** Una frase que explica lo que se entendió; texto, nunca HTML. */
  detalle?: string;
  espera: RangoEspera;
  onCancelar?: () => void;
}) {
  const enNavegador = useEnNavegador();
  const tituloId = useId();
  const preguntaId = useId();
  /** Cancelar un proceso de minutos pide confirmación: no se cancela de un clic. */
  const [confirmando, setConfirmando] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const seguirRef = useRef<HTMLButtonElement>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);

  // El foco va a «Cancelar» (o al diálogo si no hay); al preguntar, a «Seguir esperando»,
  // la opción segura.
  useEffect(() => {
    if (!enNavegador) return;
    (confirmando ? seguirRef.current : (botonRef.current ?? dialogoRef.current))?.focus();
  }, [enNavegador, confirmando]);

  // Escape pide la confirmación (o la cierra): nunca cancela de golpe.
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

  // aria-modal promete que lo de abajo está inerte: el foco circula solo entre los botones de la capa.
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
      className="fixed inset-0 z-[210] flex items-center justify-center bg-polaria-bg/80 p-4"
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
        {/* aria-live anuncia el cambio de etapa; los botones quedan fuera de la región. */}
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

export interface OrdenVentaCorreccionCorreoPanelProps {
  propuesta: PropuestaCorreccionCorreoApi;
  /** Lo que el servidor entendió de la instrucción; se muestra como texto. */
  motivo?: string;
  /** Aplica la propuesta al formulario como borrador. Lanza si no se puede. */
  onAplicar: (propuesta: PropuestaCorreccionCorreoApi) => void;
  /** Descarta la propuesta y vuelve a la instrucción. */
  onDescartar: () => void;
}

/** «1 renglón» / «2 renglones». */
export function etiquetaRenglones(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? "renglón" : "renglones"}`;
}

/** `correo.eml → PEDIDO.pdf` → `PEDIDO.pdf`: un adjunto incrustado se nombra por su archivo. */
export function nombreDeArchivo(documento: string): string {
  const partes = documento.split(" → ");
  return partes[partes.length - 1] ?? documento;
}

function etiquetaVerificacion(documento: DocumentoCorreccionApi): string {
  const { cuadra, totalDocumento, importe } = documento.verificacion;
  if (cuadra === true) return `Cuadra con el total del documento (${formatearImporte(importe)})`;
  if (cuadra === false) {
    return `No cuadra: lo leído suma ${formatearImporte(importe)} y el documento dice ${formatearImporte(totalDocumento ?? 0)}`;
  }
  return "El documento no declara total: no se pudo verificar";
}

/**
 * Propuesta de «corregir con el correo» (REQ-187): el servidor releyó los archivos
 * originales de la OV y aquí se muestra el antes/después con la verificación contra el
 * «Total pedido» de cada documento. No escribe nada: aplicar solo deja un borrador en
 * el formulario. Todo texto del correo o del servidor se muestra como texto, nunca como HTML.
 */
export function OrdenVentaCorreccionCorreoPanel({
  propuesta,
  motivo,
  onAplicar,
  onDescartar,
}: OrdenVentaCorreccionCorreoPanelProps) {
  const sinVerificar = documentosSinVerificar(propuesta);
  const puedeAplicar = puedeAplicarCorreccion(propuesta);

  return (
    <div className="flex w-full flex-1 flex-col gap-5 px-1">
      <section
        aria-label="Corrección propuesta"
        className="flex flex-col gap-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 lg:px-6 lg:py-6"
      >
        <h3 className="text-xl leading-tight font-semibold text-polaria-w lg:text-2xl">
          {`${propuesta.resumen.otAntes} OT → ${propuesta.resumen.otDespues} OT`}
        </h3>
        {motivo ? (
          <p className="break-words text-sm leading-relaxed text-polaria-w-50 lg:text-base">{motivo}</p>
        ) : null}
        <p className="text-base font-medium tabular-nums text-polaria-w lg:text-lg">
          {`${propuesta.resumen.renglonesAntes} → ${propuesta.resumen.renglonesDespues} renglones · ${formatearImporte(propuesta.resumen.importeAntes)} → ${formatearImporte(propuesta.resumen.importeDespues)}`}
        </p>
        <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
          {`${propuesta.diff.otNuevas.length} OT nuevas, ${etiquetaRenglones(propuesta.diff.renglonesAgregados)} agregados.`}
          {propuesta.diff.renglonesQuitados > 0
            ? ` ${etiquetaRenglones(propuesta.diff.renglonesQuitados)} que no ${propuesta.diff.renglonesQuitados === 1 ? "está" : "están"} en los documentos se ${propuesta.diff.renglonesQuitados === 1 ? "quita" : "quitan"}.`
            : ""}
        </p>

        <ul aria-label="Documentos leídos" className="flex flex-col gap-2">
          {propuesta.documentos.map((documento) => (
            <li
              key={documento.nombre}
              className="break-words text-base leading-relaxed text-polaria-w lg:text-lg"
            >
              <span className="font-semibold">{documento.nombre}</span>
              {documento.oc ? (
                <span className="text-polaria-w-50">{` · OC ${documento.oc}`}</span>
              ) : null}
              <span className="text-polaria-w-50">{` · ${etiquetaRenglones(documento.renglones)}`}</span>
              <br />
              <span
                className={cn(
                  "text-sm leading-relaxed lg:text-base",
                  documento.verificacion.cuadra === false
                    ? "text-polaria-danger"
                    : "text-polaria-w-50",
                )}
              >
                {etiquetaVerificacion(documento)}
              </span>
            </li>
          ))}
        </ul>

        {propuesta.advertencias.length > 0 ? (
          <ul
            aria-label="Avisos"
            className="flex flex-col gap-1.5 text-sm leading-relaxed text-polaria-w-50 lg:text-base"
          >
            {propuesta.advertencias.map((aviso, indice) => (
              <li key={`${indice}-${aviso.codigo}`} className="break-words">
                {aviso.documento ? (
                  <span className="font-medium text-polaria-w">{`${nombreDeArchivo(aviso.documento)}: `}</span>
                ) : null}
                {aviso.detalle}
              </li>
            ))}
          </ul>
        ) : null}

        {sinVerificar.length > 0 ? (
          <p role="status" className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
            Revisa a mano los documentos sin total: la lectura no se pudo comprobar.
          </p>
        ) : null}

        {!puedeAplicar ? (
          <p role="status" className="text-base font-medium text-polaria-w lg:text-lg">
            La orden ya coincide con los documentos: no hay nada que corregir.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
            Al aplicar, las órdenes de trabajo y las líneas del formulario se
            reemplazan por las de los documentos. Los productos que no se
            reconozcan quedan marcados para que los elijas.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-polaria-w-08 pt-4">
        <button type="button" className={BOTON_SECUNDARIO} onClick={onDescartar}>
          Descartar
        </button>
        <button
          type="button"
          className={BOTON_PRIMARIO}
          disabled={!puedeAplicar}
          onClick={() => onAplicar(propuesta)}
        >
          Aplicar al borrador
        </button>
      </div>
    </div>
  );
}
