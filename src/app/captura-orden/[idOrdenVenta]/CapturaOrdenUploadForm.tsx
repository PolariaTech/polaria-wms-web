"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { flushSync } from "react-dom";
import { compressImageFile } from "@/lib/images/compress-image-file";
import { ROUTES } from "@/config/routes";
import {
  CapturaOrdenCamera,
  requestSurtidoCameraStream,
} from "./CapturaOrdenCamera";

interface CapturaOrdenUploadFormProps {
  idOrdenVenta: string;
  idOrdenTrabajo?: string;
  onFilePicked?: () => void;
  onUploadOk?: () => void;
  /** Error levantado al padre: el form se desmonta durante el loading. */
  onUploadError?: (message: string) => void;
  /** El padre muestra el loading Polaria mientras sube. */
  onUploadingChange?: (uploading: boolean) => void;
}

const MAX_SELECT_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

function formatSize(file: File): string {
  return `${file.name || "foto.jpg"} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function clearCapturaQueryFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ["captura", "msg", "precision"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? url.search : ""),
      );
    }
  } catch {
    /* ignore */
  }
}

function readFirstFile(
  ...inputs: Array<HTMLInputElement | null>
): File | null {
  for (const input of inputs) {
    const file = input?.files?.[0] ?? input?.files?.item?.(0) ?? null;
    if (file) return file;
  }
  return null;
}

function mensajeErrorRespuesta(
  data: { error?: string; codigo?: string },
  status: number,
): string {
  if (typeof data.error === "string" && data.error.trim()) {
    return data.error.trim();
  }
  if (status === 422) {
    return "La foto fue tomada mal. Intenta de nuevo: la hoja debe verse clara dentro del marco.";
  }
  if (status === 413 || status === 400) {
    return "La foto no se pudo enviar. Tómala de nuevo más liviana o con mejor encuadre.";
  }
  if (status >= 500) {
    return "Mateo no pudo analizar la foto ahora. Espera un momento e intenta de nuevo.";
  }
  if (status === 0) {
    return "Error de red al subir. Revisa la conexión e inténtalo de nuevo.";
  }
  return `No se pudo procesar la foto (${status}). Intenta de nuevo.`;
}

/**
 * Cámara in-app con marco (getUserMedia en el tap).
 * Sin `capture` nativo: en iPhone abre la cámara del sistema y no hay overlay.
 */
export function CapturaOrdenUploadForm({
  idOrdenVenta,
  idOrdenTrabajo = "",
  onFilePicked,
  onUploadOk,
  onUploadError,
  onUploadingChange,
}: CapturaOrdenUploadFormProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const lastKeyRef = useRef("");
  const uploadingRef = useRef(false);
  const uploadFnRef = useRef<(picked?: File) => void>(() => {});
  const openingRef = useRef(false);
  const onUploadOkRef = useRef(onUploadOk);
  onUploadOkRef.current = onUploadOk;
  const onUploadErrorRef = useRef(onUploadError);
  onUploadErrorRef.current = onUploadError;
  const onUploadingChangeRef = useRef(onUploadingChange);
  onUploadingChangeRef.current = onUploadingChange;

  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [openingCamera, setOpeningCamera] = useState(false);
  /** Solo tras montar: evita hydration mismatch (SSR ≠ cliente en HTTP). */
  const [insecureHttp, setInsecureHttp] = useState(false);

  const actionUrl = ROUTES.capturaOrdenApi(
    idOrdenVenta,
    idOrdenTrabajo || undefined,
  );

  useEffect(() => {
    setInsecureHttp(window.isSecureContext === false);
  }, []);

  const acceptFile = useCallback(
    (picked: File) => {
      const key = fileKey(picked);
      if (key === lastKeyRef.current && hasFile) return;
      lastKeyRef.current = key;

      clearCapturaQueryFromUrl();
      onFilePicked?.();

      fileRef.current = picked;
      flushSync(() => {
        setFileLabel(formatSize(picked));
        setHasFile(true);
        setError(null);
        setDone(false);
        setLiveStream(null);
      });
      window.setTimeout(() => uploadFnRef.current(picked), 0);
    },
    [hasFile, onFilePicked],
  );

  const ingestFromInput = useCallback(() => {
    if (submitting || done) return;
    const file = readFirstFile(galleryRef.current);
    if (!file) return;
    acceptFile(file);
  }, [acceptFile, done, submitting]);

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
    if (submitting || done || openingRef.current || liveStream) return;
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
      .then((stream) => {
        setLiveStream(stream);
      })
      .catch((err: unknown) => {
        const name = err instanceof DOMException ? err.name : "";
        const msg =
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Permiso de cámara denegado. Actívalo en Ajustes (Safari/Chrome) o elige una foto de la galería."
            : name === "NotFoundError" || name === "DevicesNotFoundError"
              ? "No se encontró cámara trasera. Prueba de nuevo o elige una foto de la galería."
              : "No se pudo abrir la cámara con marco. Elige una foto de la galería.";
        setError(msg);
      })
      .finally(() => {
        openingRef.current = false;
        setOpeningCamera(false);
      });
  };

  const upload = (picked?: File) => {
    if (submitting || done || uploadingRef.current) return;

    const original =
      picked ??
      fileRef.current ??
      readFirstFile(galleryRef.current);
    if (!original) {
      setError("Selecciona una foto de la hoja llenada.");
      return;
    }

    uploadingRef.current = true;
    setSubmitting(true);
    onUploadingChangeRef.current?.(true);
    setError(null);

    void (async () => {
      let toSend = original;
      try {
        toSend = await Promise.race([
          compressImageFile(original, {
            maxBytes: MAX_UPLOAD_BYTES,
            maxEdge: 2400,
            quality: 0.88,
          }),
          new Promise<File>((resolve) => {
            window.setTimeout(() => resolve(original), 10_000);
          }),
        ]);
      } catch {
        toSend = original;
      }

      if (toSend.size > MAX_SELECT_BYTES) {
        const msg =
          "La foto supera 10 MB y no se pudo comprimir lo suficiente. Tómala de nuevo más cerca o con menos resolución.";
        uploadingRef.current = false;
        setSubmitting(false);
        onUploadingChangeRef.current?.(false);
        setError(msg);
        onUploadErrorRef.current?.(msg);
        return;
      }

      fileRef.current = toSend;
      const body = new FormData();
      body.append("foto", toSend, toSend.name || "hoja-surtido.jpg");
      if (idOrdenTrabajo.trim()) {
        body.append("ot", idOrdenTrabajo.trim());
      }

      const fail = (msg: string) => {
        setError(msg);
        onUploadErrorRef.current?.(msg);
      };

      try {
        const response = await fetch(actionUrl, {
          method: "POST",
          headers: { Accept: "application/json" },
          body,
        });
        let data: {
          ok?: boolean;
          error?: string;
          codigo?: string;
        } = {};
        try {
          data = (await response.json()) as typeof data;
        } catch {
          data = {};
        }

        if (response.ok && data.ok) {
          setDone(true);
          onUploadOkRef.current?.();
          return;
        }

        fail(mensajeErrorRespuesta(data, response.status));
      } catch {
        fail("Error de red al subir. Revisa la conexión e inténtalo de nuevo.");
      } finally {
        uploadingRef.current = false;
        setSubmitting(false);
        onUploadingChangeRef.current?.(false);
      }
    })();
  };

  uploadFnRef.current = upload;

  if (done || submitting) return null;

  const pillClass =
    "relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-polaria-teal px-6 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-60";

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

      {fileLabel ? (
        <p className="text-center polaria-text-caption text-polaria-w-50">
          {fileLabel}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-center polaria-text-caption text-polaria-w-50"
        >
          {error}
        </p>
      ) : null}

      <p className="text-center polaria-text-caption text-polaria-w-50">
        {insecureHttp
          ? "Estás en HTTP local: iPhone bloquea la cámara con marco. Prueba el QR en HTTPS (preview/prod) o elige de galería."
          : "Encaja la hoja impresa dentro del marco. Debe verse clara la hora impresa."}
      </p>

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

      <button
        type="button"
        onClick={openLiveCamera}
        disabled={openingCamera}
        className={pillClass}
        aria-label="Tomar foto"
      >
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none relative z-0 h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4.5 8.5h2.2l1.1-2h6.4l1.1 2H19.5A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10A1.5 1.5 0 0 1 4.5 8.5Z" />
          <circle cx="12" cy="13.5" r="3.1" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        className="w-full text-center polaria-text-caption font-medium text-polaria-teal underline-offset-2 hover:underline"
      >
        Elegir de galería
      </button>
    </div>
  );
}
