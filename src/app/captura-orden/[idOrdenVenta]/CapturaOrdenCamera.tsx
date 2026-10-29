"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CapturaOrdenCameraProps {
  /** Stream ya pedido en el gesto del usuario (iOS exige getUserMedia en el tap). */
  stream: MediaStream;
  onCapture: (file: File) => void;
  onCancel: () => void;
}

/** Intentos compatibles Android Chrome + iOS Safari (trasero primero). */
const CAMERA_CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
  {
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 2560 },
    },
  },
  { audio: false, video: { facingMode: "environment" } },
  { audio: false, video: true },
];

/**
 * Pide cámara trasera con fallbacks. Llamar en el mismo gesto del tap (iOS).
 */
export async function requestSurtidoCameraStream(): Promise<MediaStream> {
  const media = navigator.mediaDevices;
  if (!media?.getUserMedia) {
    throw new DOMException(
      "mediaDevices no disponible",
      "NotSupportedError",
    );
  }

  let lastError: unknown;
  for (const constraints of CAMERA_CONSTRAINT_ATTEMPTS) {
    try {
      return await media.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new DOMException("No se pudo abrir la cámara", "NotReadableError");
}

/**
 * ¿Hay una hoja clara llenando el rectángulo guía?
 * Heurística liviana (luminancia) sobre el recorte object-cover.
 */
function hojaLlenaElMarco(
  video: HTMLVideoElement,
  frameEl: HTMLElement,
): boolean {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) return false;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const vr = video.getBoundingClientRect();
  const fr = frameEl.getBoundingClientRect();
  if (vr.width <= 0 || vr.height <= 0) return false;

  const scale = Math.max(vr.width / vw, vr.height / vh);
  const dispW = vw * scale;
  const dispH = vh * scale;
  const offX = (dispW - vr.width) / 2;
  const offY = (dispH - vr.height) / 2;

  const left = (fr.left - vr.left + offX) / scale;
  const top = (fr.top - vr.top + offY) / scale;
  const width = fr.width / scale;
  const height = fr.height / scale;

  const sx = Math.max(0, Math.floor(left));
  const sy = Math.max(0, Math.floor(top));
  const sw = Math.min(vw - sx, Math.floor(width));
  const sh = Math.min(vh - sy, Math.floor(height));
  if (sw < 24 || sh < 32) return false;

  const sampleW = 48;
  const sampleH = 64;
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sampleW, sampleH);

  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
  let light = 0;
  let sum = 0;
  const total = sampleW * sampleH;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += luma;
    if (luma >= 105) light += 1;
  }
  const mean = sum / total;
  const lightRatio = light / total;
  // Hoja blanca/clara llenando el marco (no manos/caja oscura).
  return mean >= 95 && lightRatio >= 0.52;
}

/**
 * Vista previa in-app + marco rectangular tipo hoja (Android e iOS).
 * Rojo = mal ubicada; teal = hoja bien en el cuadro.
 */
export function CapturaOrdenCamera({
  stream,
  onCapture,
  onCancel,
}: CapturaOrdenCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream>(stream);
  streamRef.current = stream;
  const goodStreakRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [hojaOk, setHojaOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    const current = streamRef.current;
    for (const track of current.getTracks()) track.stop();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;
    video.muted = true;
    video.defaultMuted = true;
    video.srcObject = stream;

    const markReady = () => {
      if (!cancelled && video.videoWidth > 0) setReady(true);
    };

    const onMeta = () => markReady();
    const onPlaying = () => markReady();
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("playing", onPlaying);

    void (async () => {
      try {
        await video.play();
        markReady();
      } catch {
        try {
          await new Promise<void>((resolve) => {
            if (video.readyState >= 2) {
              resolve();
              return;
            }
            video.addEventListener("loadeddata", () => resolve(), {
              once: true,
            });
          });
          await video.play();
          markReady();
        } catch {
          if (!cancelled) {
            setError(
              "No se pudo mostrar la cámara. Cierra e intenta de nuevo o usa la galería.",
            );
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("playing", onPlaying);
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const video = videoRef.current;
      const frame = frameRef.current;
      if (!video || !frame) return;
      const ok = hojaLlenaElMarco(video, frame);
      if (ok) {
        goodStreakRef.current += 1;
      } else {
        goodStreakRef.current = 0;
      }
      // 2 samples (~500ms) para no parpadear.
      setHojaOk(goodStreakRef.current >= 2);
    }, 250);
    return () => window.clearInterval(id);
  }, [ready]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth <= 0) {
      setError("Espera a que la cámara cargue e intenta de nuevo.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("No se pudo capturar el fotograma.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("No se pudo guardar la foto. Intenta de nuevo.");
          return;
        }
        stopStream();
        onCapture(
          new File([blob], `hoja-surtido-${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture, stopStream]);

  const cancel = () => {
    stopStream();
    onCancel();
  };

  const frameColor = hojaOk ? "border-polaria-teal" : "border-polaria-danger";
  const cornerColor = hojaOk ? "border-polaria-teal" : "border-polaria-danger";
  const shutterRing = hojaOk ? "border-polaria-teal" : "border-polaria-danger";
  const shutterDot = hojaOk ? "bg-polaria-teal" : "bg-polaria-danger";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-polaria-bg">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-polaria-bg">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Solo rectángulo: oscurece fuera del marco (sin óvalo/cara). */}
        <div
          ref={frameRef}
          aria-hidden
          className={`pointer-events-none absolute left-1/2 top-[46%] w-[min(82vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-sm border-[3px] ${frameColor}`}
          style={{
            aspectRatio: "3 / 4",
            boxShadow: "0 0 0 9999px rgba(2, 6, 9, 0.72)",
          }}
        >
          <span
            className={`absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] ${cornerColor}`}
          />
          <span
            className={`absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] ${cornerColor}`}
          />
          <span
            className={`absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] ${cornerColor}`}
          />
          <span
            className={`absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] ${cornerColor}`}
          />
        </div>

        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-polaria-bg/90 to-transparent px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <p className="text-center polaria-text-body-sm text-polaria-w">
            {hojaOk
              ? "Hoja bien ubicada — puedes capturar"
              : "Encaja la hoja dentro del marco"}
          </p>
          <p className="mt-1 text-center polaria-text-caption text-polaria-w-50">
            {hojaOk
              ? "Marco en teal: de frente y legible"
              : "Marco rojo: acerca la hoja hasta llenar el cuadro"}
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="px-4 py-2 text-center polaria-text-caption text-polaria-w-50"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={cancel}
          className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm font-semibold text-polaria-w"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={capture}
          disabled={!ready}
          aria-label="Capturar hoja"
          className={`flex h-16 w-16 items-center justify-center rounded-full border-4 bg-polaria-w disabled:opacity-40 ${shutterRing}`}
        >
          <span className={`h-12 w-12 rounded-full ${shutterDot}`} />
        </button>
        <span className="w-[5.5rem]" aria-hidden />
      </div>
    </div>
  );
}
