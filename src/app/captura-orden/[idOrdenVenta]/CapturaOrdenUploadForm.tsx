"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { flushSync } from "react-dom";
import { ROUTES } from "@/config/routes";
import {
  CapturaOrdenCamera,
  requestSurtidoCameraStream,
} from "./CapturaOrdenCamera";
import { IconoCamara, IconoReintentar } from "./CapturaEstadoIcono";
import {
  MAX_SELECT_BYTES,
  MENSAJE_FOTO_PESADA,
  clearCapturaQueryFromUrl,
  enviarFoto,
  fileKey,
  mensajeErrorCamara,
  mensajeErrorRespuesta,
  prepararFoto,
  readFirstFile,
} from "./captura-upload-utils";

interface CapturaOrdenUploadFormProps {
  idOrdenVenta: string;
  idOrdenTrabajo?: string;
  onFilePicked?: () => void;
  /** El servidor recibió la foto y la procesa en segundo plano; `idIntento` permite seguirla. */
  onReceived?: (idIntento: string) => void;
  /** Respuesta síncrona (servidor antiguo): la foto ya quedó procesada. */
  onUploadOk?: () => void;
  /** Quien nos usa muestra el error: la subida no bloquea la pantalla. */
  onUploadError?: (message: string) => void;
  /** Avisa cuando empieza o termina el envío (1 a 3 s; la lectura con IA va aparte). */
  onUploadingChange?: (uploading: boolean) => void;
  /** Foto que el servidor ya tiene y falló al procesar: se reintenta sin volver a enviarla. */
  idIntentoReintento?: string | null;
}

const BOTON_PRINCIPAL =
  "flex h-14 w-full items-center justify-center gap-3 rounded-full bg-polaria-teal px-6 font-semibold text-polaria-on-teal hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-polaria-teal disabled:opacity-60";
/** Utilidades directas: `polaria-text-caption` fija su color y taparía el teal. */
const BOTON_TEXTO =
  "flex min-h-11 w-full items-center justify-center text-center text-sm font-semibold text-polaria-teal underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-polaria-teal";

/**
 * Cámara in-app con marco (getUserMedia en el tap).
 * Sin `capture` nativo: en iPhone abre la cámara del sistema y no hay overlay.
 * El envío dura 1 a 3 s: el servidor responde «recibida» y lee la hoja aparte, así que
 * se puede seguir tomando fotos sin esperar. El estado lo pinta el padre.
 */
export function CapturaOrdenUploadForm({
  idOrdenVenta,
  idOrdenTrabajo = "",
  onFilePicked,
  onReceived,
  onUploadOk,
  onUploadError,
  onUploadingChange,
  idIntentoReintento = null,
}: CapturaOrdenUploadFormProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const lastKeyRef = useRef("");
  const uploadingRef = useRef(false);
  const uploadFnRef = useRef<(picked?: File) => void>(() => {});
  const openingRef = useRef(false);
  /** Los avisos al padre cambian en cada render: se leen desde aquí, ya actualizados, al enviar. */
  const avisos = useRef({ onReceived, onUploadOk, onUploadError, onUploadingChange });

  const [hasFile, setHasFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  /** El último envío falló y la foto sigue guardada para reenviarla. */
  const [failed, setFailed] = useState(false);
  /** Errores de cámara o de selección; los de envío los muestra el padre. */
  const [error, setError] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [openingCamera, setOpeningCamera] = useState(false);
  /** Solo tras montar: evita hydration mismatch (SSR ≠ cliente en HTTP). */
  const [insecureHttp, setInsecureHttp] = useState(false);

  const actionUrl = ROUTES.capturaOrdenApi(idOrdenVenta, idOrdenTrabajo || undefined);

  useEffect(() => {
    setInsecureHttp(window.isSecureContext === false);
  }, []);

  useEffect(() => {
    avisos.current = { onReceived, onUploadOk, onUploadError, onUploadingChange };
  });

  const acceptFile = useCallback(
    (picked: File) => {
      const key = fileKey(picked);
      if (key === lastKeyRef.current && hasFile && !failed) return;
      lastKeyRef.current = key;

      clearCapturaQueryFromUrl();
      onFilePicked?.();

      fileRef.current = picked;
      flushSync(() => {
        setHasFile(true);
        setError(null);
        setDone(false);
        setFailed(false);
        setLiveStream(null);
      });
      window.setTimeout(() => uploadFnRef.current(picked), 0);
    },
    [failed, hasFile, onFilePicked],
  );

  const ingestFromInput = useCallback(() => {
    if (submitting) return;
    const file = readFirstFile(galleryRef.current);
    if (!file) return;
    acceptFile(file);
  }, [acceptFile, submitting]);

  useEffect(() => {
    const gallery = galleryRef.current;
    const onPick = () => ingestFromInput();
    gallery?.addEventListener("change", onPick);
    gallery?.addEventListener("input", onPick);
    return () => {
      gallery?.removeEventListener("change", onPick);
      gallery?.removeEventListener("input", onPick);
    };
  }, [ingestFromInput]);

  const onReactChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
  };

  const openLiveCamera = () => {
    if (submitting || openingRef.current || liveStream) return;
    setError(null);

    // iOS/Safari solo expone mediaDevices en HTTPS o localhost.
    // http://192.168.x.x → sin getUserMedia → no hay marco posible.
    if (insecureHttp || !navigator.mediaDevices?.getUserMedia) {
      setError(
        insecureHttp
          ? "La cámara con marco solo funciona en HTTPS (no en http://IP). Abre el link seguro del QR o usa «Elegir de galería»."
          : "Este navegador no permite cámara con marco. Usa «Elegir de galería».",
      );
      return;
    }

    openingRef.current = true;
    setOpeningCamera(true);

    // Crítico en iOS/Android: getUserMedia en el mismo gesto del tap.
    void requestSurtidoCameraStream()
      .then((stream) => setLiveStream(stream))
      .catch((err: unknown) => setError(mensajeErrorCamara(err)))
      .finally(() => {
        openingRef.current = false;
        setOpeningCamera(false);
      });
  };

  const reportFail = (message: string) => {
    setFailed(true);
    if (avisos.current.onUploadError) avisos.current.onUploadError(message);
    else setError(message);
  };

  const iniciarEnvio = () => {
    uploadingRef.current = true;
    setSubmitting(true);
    setFailed(false);
    setError(null);
    avisos.current.onUploadingChange?.(true);
  };

  const terminarEnvio = () => {
    uploadingRef.current = false;
    setSubmitting(false);
    avisos.current.onUploadingChange?.(false);
  };

  const enviar = async (url: string, body?: FormData) => {
    try {
      const respuesta = await enviarFoto(url, body);
      if (respuesta.ok && respuesta.data.ok) {
        setDone(true);
        if (respuesta.data.idIntento) avisos.current.onReceived?.(respuesta.data.idIntento);
        else avisos.current.onUploadOk?.();
        return;
      }
      reportFail(mensajeErrorRespuesta(respuesta.data, respuesta.status));
    } catch {
      reportFail(mensajeErrorRespuesta({}, 0));
    } finally {
      terminarEnvio();
    }
  };

  const upload = (picked?: File) => {
    if (submitting || done || uploadingRef.current) return;

    const original = picked ?? fileRef.current ?? readFirstFile(galleryRef.current);
    if (!original) {
      setError("Selecciona una foto de la hoja llenada.");
      return;
    }

    iniciarEnvio();
    void (async () => {
      const toSend = await prepararFoto(original);
      if (toSend.size > MAX_SELECT_BYTES) {
        reportFail(MENSAJE_FOTO_PESADA);
        terminarEnvio();
        return;
      }

      fileRef.current = toSend;
      const body = new FormData();
      body.append("foto", toSend, toSend.name || "hoja-surtido.jpg");
      if (idOrdenTrabajo.trim()) body.append("ot", idOrdenTrabajo.trim());
      await enviar(actionUrl, body);
    })();
  };

  useEffect(() => {
    uploadFnRef.current = upload;
  });

  /** El servidor ya tiene la foto: solo se le pide procesarla de nuevo. */
  const reintentarEnServidor = (idIntento: string) => {
    if (submitting || uploadingRef.current) return;
    iniciarEnvio();
    const separador = actionUrl.includes("?") ? "&" : "?";
    void enviar(`${actionUrl}${separador}reintentar=${encodeURIComponent(idIntento)}`);
  };

  const reintentar = Boolean(idIntentoReintento) || (failed && hasFile);
  const etiqueta = reintentar ? "Reintentar" : done ? "Nueva foto" : "Tomar foto";
  const alPulsarPrincipal = () => {
    if (idIntentoReintento) reintentarEnServidor(idIntentoReintento);
    else if (reintentar) upload();
    else openLiveCamera();
  };

  return (
    <div className="space-y-4">
      {liveStream ? (
        <CapturaOrdenCamera
          stream={liveStream}
          onCapture={acceptFile}
          onCancel={() => {
            for (const track of liveStream.getTracks()) track.stop();
            setLiveStream(null);
          }}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-center polaria-text-caption text-polaria-w-50">
          {error}
        </p>
      ) : null}

      {/* Sin capture: evita la cámara nativa de iOS (sin marco). */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={onReactChange}
        className="sr-only"
        tabIndex={-1}
        aria-label="Elegir de galería"
      />

      {submitting ? null : (
        <>
          {insecureHttp || !(done || reintentar) ? (
            <p className="text-center polaria-text-caption text-polaria-w-50">
              {insecureHttp
                ? "Estás en HTTP local: iPhone bloquea la cámara con marco. Prueba el QR en HTTPS (preview/prod) o elige de galería."
                : "Encaja la hoja impresa dentro del marco. Debe verse clara la hora impresa."}
            </p>
          ) : null}

          <button
            type="button"
            onClick={alPulsarPrincipal}
            disabled={openingCamera}
            className={BOTON_PRINCIPAL}
            aria-label={etiqueta}
          >
            {reintentar ? <IconoReintentar /> : <IconoCamara />}
            <span>{etiqueta}</span>
          </button>

          {reintentar ? (
            <button type="button" onClick={openLiveCamera} className={BOTON_TEXTO}>
              Tomar otra foto
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className={BOTON_TEXTO}
          >
            Elegir de galería
          </button>
        </>
      )}
    </div>
  );
}
