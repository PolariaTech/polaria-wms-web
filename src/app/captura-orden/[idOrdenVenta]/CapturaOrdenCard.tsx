"use client";

import { useCallback, useEffect, useState } from "react";
import { PoloWorking } from "@/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel";
import { describirEspera } from "@/modules/sales/ordenes/utils/ot/aplicar-correccion-correo";
import { CapturaEstadoIcono } from "./CapturaEstadoIcono";
import { CapturaOrdenUploadForm } from "./CapturaOrdenUploadForm";
import { CapturaSesionLista } from "./CapturaSesionLista";
import type { CapturaOrdenMetaView } from "./captura-orden.types";
import {
  CAPTURA_BUSY_PHRASES,
  CAPTURA_BUSY_PHRASE_MS,
  CAPTURA_DONE_PHRASE,
  ESPERA_LEER_HOJA,
} from "./captura-busy-phrases";
import {
  claveRegistro,
  estadoVisible,
  otrasHojas,
  registrarCaptura,
  useAhora,
  useRegistrosCaptura,
  type EstadoRegistro,
  type FaseCaptura,
} from "./captura-sesion";
import { useSeguimientoCaptura } from "./useSeguimientoCaptura";

interface CapturaOrdenCardProps {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  meta: CapturaOrdenMetaView;
  flashOk: boolean;
  flashError: string | null;
}

/** Utilidades directas: las clases `polaria-text-*` fijan su color y le ganan a `text-polaria-w-50`. */
const TITULO_ESTADO = "text-xl font-semibold leading-tight text-polaria-w";
const LINEA_ESTADO = "max-w-xs text-balance text-sm leading-relaxed text-polaria-w-50";

function CapturaCameraMark() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center" aria-hidden>
        <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-polaria-teal" />
        <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-polaria-teal" />
        <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-polaria-teal" />
        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-polaria-teal" />
        <svg
          viewBox="0 0 24 24"
          className="h-9 w-9 text-polaria-teal"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 8.5h2.2l1.1-2h6.4l1.1 2H19.5A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10A1.5 1.5 0 0 1 4.5 8.5Z" />
          <circle cx="12" cy="13.5" r="3.1" />
        </svg>
      </div>
      <p className="polaria-text-card-title mt-3 text-polaria-w">Captura</p>
    </div>
  );
}

/** «OT 2/9», o nada si la OV tiene una sola hoja. */
function etiquetaOt(orden: CapturaOrdenMetaView["ordenTrabajo"]): string | undefined {
  return orden && orden.total > 1 ? `OT ${orden.indice}/${orden.total}` : undefined;
}

/**
 * Qué hoja se va a fotografiar: el mismo «2/9» y centro de consumo que lleva
 * impresos, para comprobarlo contra el papel antes de tomar la foto.
 */
function CapturaHojaTitulo({ meta }: { meta: CapturaOrdenMetaView }) {
  const etiqueta = etiquetaOt(meta.ordenTrabajo);
  const centro = meta.ordenTrabajo?.centroConsumo.trim();
  return (
    <section className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3.5 text-center">
      <p className="polaria-text-card-title truncate text-polaria-w">{meta.folio}</p>
      {etiqueta ? (
        <p className="mt-1 text-3xl font-bold leading-tight tabular-nums text-polaria-teal">
          {etiqueta}
        </p>
      ) : null}
      {centro ? (
        <p className="mt-1 text-balance text-sm font-medium leading-snug text-polaria-w">
          {centro}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Estado de la foto de esta hoja. Va con icono, una palabra clave y una línea:
 * se entiende sin leer. Ninguno tapa la pantalla: se puede seguir tomando fotos.
 */
function CapturaEstadoPanel({
  fase,
  mensaje,
  frase,
}: {
  fase: FaseCaptura;
  mensaje: string | null;
  frase: string;
}) {
  if (fase === "reposo") return null;

  if (fase === "subiendo") {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col items-center text-center">
        <CapturaEstadoIcono estado="subiendo" />
        <p className={`mt-5 ${TITULO_ESTADO}`}>Enviando la foto</p>
        <p className={`mt-2 ${LINEA_ESTADO}`}>Un momento…</p>
      </div>
    );
  }

  if (fase === "procesando") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex flex-col items-center rounded-3xl border border-polaria-t-20 bg-polaria-t-08 px-6 py-6 text-center"
      >
        <PoloWorking className="w-28 lg:w-28" />
        <p className={`mt-4 ${TITULO_ESTADO}`}>Foto recibida</p>
        <p className={`mt-2 ${LINEA_ESTADO}`}>{frase}</p>
        <p className={`mt-1 ${LINEA_ESTADO}`}>{describirEspera(ESPERA_LEER_HOJA)}</p>
        <p className={`mt-3 ${LINEA_ESTADO}`}>
          Ya puedes tomar otra foto o escanear la siguiente hoja.
        </p>
      </div>
    );
  }

  if (fase === "lista") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center text-center">
        <CapturaEstadoIcono estado="lista" />
        <p className={`mt-5 ${TITULO_ESTADO}`}>{CAPTURA_DONE_PHRASE}</p>
        <p className={`mt-2 ${LINEA_ESTADO}`}>
          Foto guardada. Para la siguiente hoja, escanea su QR.
        </p>
      </div>
    );
  }

  return (
    <div role="alert" className="flex flex-col items-center text-center">
      <CapturaEstadoIcono estado="fallo" />
      <p className={`mt-5 ${TITULO_ESTADO}`}>No se subió la foto</p>
      {mensaje ? (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-polaria-w">{mensaje}</p>
      ) : null}
      <p className={`mt-1 ${LINEA_ESTADO}`}>No se guardó esta captura.</p>
    </div>
  );
}

/**
 * Parte interactiva de la captura (cliente): puede ocultar el flash
 * viejo de la URL al elegir una foto nueva (caso típico en iPhone).
 * Si ya hay foto, el upsert del API la reemplaza (sin aviso en UI).
 * Cada pestaña es una sola hoja. La foto se envía (1 a 3 s) y el servidor la lee
 * aparte: su estado se sigue en el registro del celular, que comparten las pestañas,
 * así que un fallo no se pierde al escanear la siguiente hoja.
 */
export function CapturaOrdenCard({
  idOrdenVenta,
  idOrdenTrabajo,
  meta,
  flashOk,
  flashError,
}: CapturaOrdenCardProps) {
  const [hideFlash, setHideFlash] = useState(false);
  /** «recibida»: el servidor ya tiene la foto y su estado sale del registro. */
  const [fase, setFase] = useState<FaseCaptura | "recibida">("reposo");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const registros = useRegistrosCaptura();
  useSeguimientoCaptura(registros);
  const ahora = useAhora(15_000);

  const etiqueta = etiquetaOt(meta.ordenTrabajo);
  const registrar = useCallback(
    (estado: EstadoRegistro, extra: { idIntento?: string } = {}) =>
      registrarCaptura({
        idOrdenVenta,
        idOrdenTrabajo,
        folio: meta.folio,
        etiqueta,
        estado,
        at: Date.now(),
        ...extra,
      }),
    [etiqueta, idOrdenTrabajo, idOrdenVenta, meta.folio],
  );

  const onFilePicked = useCallback(() => {
    setHideFlash(true);
    setMensaje(null);
    setPhraseIndex(0);
    setFase("subiendo");
  }, []);

  const onUploadingChange = useCallback((uploading: boolean) => {
    if (uploading) setFase("subiendo");
  }, []);

  const onReceived = useCallback(
    (idIntento: string) => {
      registrar("procesando", { idIntento });
      setMensaje(null);
      setPhraseIndex(0);
      setFase("recibida");
    },
    [registrar],
  );

  const onUploadOk = useCallback(() => {
    registrar("lista");
    setMensaje(null);
    setFase("recibida");
  }, [registrar]);

  const onUploadError = useCallback((message: string) => {
    setMensaje(message);
    setFase("fallo");
  }, []);

  const propio = registros.find(
    (r) => claveRegistro(r) === claveRegistro({ idOrdenVenta, idOrdenTrabajo }),
  );
  const faseServidor: FaseCaptura = propio?.estado === "lista" || propio?.estado === "fallo"
    ? propio.estado
    : "procesando";

  // Sin JavaScript la subida vuelve por la URL (?captura=ok|error): se respeta.
  const faseVista: FaseCaptura =
    fase === "recibida"
      ? faseServidor
      : fase !== "reposo"
        ? fase
        : hideFlash
          ? "reposo"
          : flashOk
            ? "lista"
            : flashError
              ? "fallo"
              : "reposo";
  const mensajeVista =
    fase === "recibida"
      ? (propio?.mensaje ?? null)
      : (mensaje ?? (faseVista === "fallo" ? flashError : null));
  const idIntentoReintento =
    fase === "recibida" && faseVista === "fallo" ? (propio?.idIntento ?? null) : null;

  useEffect(() => {
    if (faseVista !== "procesando") return;
    const id = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % CAPTURA_BUSY_PHRASES.length);
    }, CAPTURA_BUSY_PHRASE_MS);
    return () => window.clearInterval(id);
  }, [faseVista]);

  useEffect(() => {
    if (fase === "subiendo" || fase === "fallo") registrar(fase);
  }, [fase, registrar]);

  const hojas = otrasHojas(registros, { idOrdenVenta, idOrdenTrabajo }, ahora).map((registro) => ({
    idOrdenVenta: registro.idOrdenVenta,
    idOrdenTrabajo: registro.idOrdenTrabajo,
    folio: registro.folio,
    etiqueta: registro.etiqueta,
    estado: estadoVisible(registro, ahora),
  }));

  return (
    <div className="space-y-6">
      {faseVista === "reposo" ? <CapturaCameraMark /> : null}

      <CapturaHojaTitulo meta={meta} />

      <CapturaEstadoPanel
        fase={faseVista}
        mensaje={mensajeVista}
        frase={CAPTURA_BUSY_PHRASES[phraseIndex] ?? CAPTURA_BUSY_PHRASES[0]}
      />

      <CapturaOrdenUploadForm
        idOrdenVenta={idOrdenVenta}
        idOrdenTrabajo={idOrdenTrabajo}
        idIntentoReintento={idIntentoReintento}
        onFilePicked={onFilePicked}
        onReceived={onReceived}
        onUploadOk={onUploadOk}
        onUploadError={onUploadError}
        onUploadingChange={onUploadingChange}
      />

      <CapturaSesionLista hojas={hojas} />
    </div>
  );
}
