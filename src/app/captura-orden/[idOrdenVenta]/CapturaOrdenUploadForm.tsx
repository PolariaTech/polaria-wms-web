"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { compressImageFile } from "@/lib/images/compress-image-file";
import { ROUTES } from "@/config/routes";

interface CapturaOrdenUploadFormProps {
  idOrdenVenta: string;
  idOrdenTrabajo?: string;
  onFilePicked?: () => void;
}

const MAX_SELECT_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

function labelPrecision(precision: number): string {
  if (precision >= 85) return "Alta";
  if (precision >= 60) return "Media";
  if (precision >= 35) return "Baja";
  return "Muy baja";
}

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

/**
 * Un solo input de cámara. Sin <form action> para que Safari no recargue al volver.
 */
export function CapturaOrdenUploadForm({
  idOrdenVenta,
  idOrdenTrabajo = "",
  onFilePicked,
}: CapturaOrdenUploadFormProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const lastKeyRef = useRef("");
  const uploadingRef = useRef(false);
  const uploadFnRef = useRef<(picked?: File) => void>(() => {});

  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precision, setPrecision] = useState<number | null>(null);

  const actionUrl = ROUTES.capturaOrdenApi(
    idOrdenVenta,
    idOrdenTrabajo || undefined,
  );

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
        setPrecision(null);
        setDone(false);
      });
      window.setTimeout(() => uploadFnRef.current(picked), 0);
    },
    [hasFile, onFilePicked],
  );

  const ingestFromInput = useCallback(() => {
    if (submitting || done) return;
    const file = readFirstFile(cameraRef.current);
    if (!file) return;
    acceptFile(file);
  }, [acceptFile, done, submitting]);

  useEffect(() => {
    const camera = cameraRef.current;

    const onPick = () => ingestFromInput();
    camera?.addEventListener("change", onPick);
    camera?.addEventListener("input", onPick);

    const onReturn = () => {
      window.setTimeout(ingestFromInput, 0);
      window.setTimeout(ingestFromInput, 300);
      window.setTimeout(ingestFromInput, 800);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onReturn();
    };

    window.addEventListener("focus", onReturn);
    window.addEventListener("pageshow", onReturn);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      camera?.removeEventListener("change", onPick);
      camera?.removeEventListener("input", onPick);
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("pageshow", onReturn);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ingestFromInput]);

  const onReactChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
  };

  const upload = (picked?: File) => {
    if (submitting || done || uploadingRef.current) return;

    const original =
      picked ??
      fileRef.current ??
      readFirstFile(cameraRef.current);
    if (!original) {
      setError("Selecciona una foto de la hoja llenada.");
      return;
    }

    uploadingRef.current = true;
    setSubmitting(true);
    setError(null);

    void (async () => {
      let toSend = original;
      try {
        toSend = await Promise.race([
          compressImageFile(original, {
            maxBytes: MAX_UPLOAD_BYTES,
            maxEdge: 1800,
            quality: 0.72,
          }),
          new Promise<File>((resolve) => {
            window.setTimeout(() => resolve(original), 10_000);
          }),
        ]);
      } catch {
        toSend = original;
      }

      if (toSend.size > MAX_SELECT_BYTES) {
        uploadingRef.current = false;
        setSubmitting(false);
        setError("La foto supera 10 MB y no se pudo comprimir lo suficiente.");
        return;
      }

      fileRef.current = toSend;
      const body = new FormData();
      body.append("foto", toSend, toSend.name || "hoja-surtido.jpg");
      if (idOrdenTrabajo.trim()) {
        body.append("ot", idOrdenTrabajo.trim());
      }

      try {
        const response = await fetch(actionUrl, {
          method: "POST",
          headers: { Accept: "application/json" },
          body,
        });
        let data: {
          ok?: boolean;
          error?: string;
          precisionEstimada?: number;
        } = {};
        try {
          data = (await response.json()) as typeof data;
        } catch {
          data = {};
        }

        if (response.ok && data.ok) {
          setDone(true);
          setPrecision(
            typeof data.precisionEstimada === "number"
              ? data.precisionEstimada
              : null,
          );
          return;
        }

        setError(
          data.error ||
            `No se pudo procesar la foto (${response.status || "red"}).`,
        );
      } catch {
        setError("Error de red al subir. Revisa la conexión e inténtalo de nuevo.");
      } finally {
        uploadingRef.current = false;
        setSubmitting(false);
      }
    })();
  };

  uploadFnRef.current = upload;

  const resetAll = () => {
    uploadingRef.current = false;
    lastKeyRef.current = "";
    fileRef.current = null;
    if (cameraRef.current) cameraRef.current.value = "";
    setFileLabel(null);
    setHasFile(false);
    setSubmitting(false);
    setDone(false);
    setError(null);
    setPrecision(null);
  };

  const pickerClass =
    "absolute inset-0 z-20 m-0 h-full w-full cursor-pointer p-0";
  const pickerStyle = {
    opacity: 0.01,
    fontSize: 16,
    WebkitTapHighlightColor: "transparent",
    pointerEvents: submitting || done ? "none" : "auto",
  } as const;

  const pillClass =
    "relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-polaria-teal px-6 font-semibold text-polaria-bg hover:opacity-90";

  return (
    <div className="space-y-4">
      {fileLabel && !done ? (
        <p className="text-center polaria-text-caption text-polaria-w-50">
          {fileLabel}
        </p>
      ) : null}

      {precision != null && done ? (
        <p className="text-center polaria-text-body-sm text-polaria-teal">
          {precision}% · {labelPrecision(precision)}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-center polaria-text-caption text-polaria-w-50">
          {error}
        </p>
      ) : null}

      {!done ? (
        submitting ? (
          <div className={cn(pillClass, "pointer-events-none opacity-70")}>
            Subiendo…
          </div>
        ) : (
          <div className={pillClass}>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onReactChange}
              className={pickerClass}
              style={pickerStyle}
              aria-label="Tomar foto"
            />
            <span className="pointer-events-none relative z-0 flex items-center gap-3 text-sm font-semibold text-polaria-bg">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
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
              <span className="h-5 w-px bg-polaria-w-08" aria-hidden />
              Tomar foto
            </span>
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={resetAll}
          className="flex h-14 w-full items-center justify-center rounded-full border border-polaria-t-20 bg-polaria-t-08 font-semibold text-polaria-w hover:opacity-90"
        >
          Tomar otra foto
        </button>
      )}
    </div>
  );
}
