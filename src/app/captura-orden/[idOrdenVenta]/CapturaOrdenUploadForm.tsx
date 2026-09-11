"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { compressImageFile } from "@/lib/images/compress-image-file";
import { ROUTES } from "@/config/routes";

interface CapturaOrdenUploadFormProps {
  idOrdenVenta: string;
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

/**
 * Flujo simple (iOS): elegir foto → se activa “Subir y leer hoja” → subir.
 * Sin barra de progreso.
 */
export function CapturaOrdenUploadForm({
  idOrdenVenta,
  onFilePicked,
}: CapturaOrdenUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const lastKeyRef = useRef("");
  const uploadingRef = useRef(false);

  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precision, setPrecision] = useState<number | null>(null);

  const actionUrl = ROUTES.capturaOrdenApi(idOrdenVenta);

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
    },
    [hasFile, onFilePicked],
  );

  const ingestFromInput = useCallback(() => {
    if (submitting || done) return;
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    acceptFile(file);
  }, [acceptFile, done, submitting]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onPick = () => ingestFromInput();
    input.addEventListener("change", onPick);
    input.addEventListener("input", onPick);

    const onReturn = () => {
      window.setTimeout(ingestFromInput, 0);
      window.setTimeout(ingestFromInput, 300);
      window.setTimeout(ingestFromInput, 800);
    };

    window.addEventListener("focus", onReturn);
    window.addEventListener("pageshow", onReturn);
    const onVisibility = () => {
      if (document.visibilityState === "visible") onReturn();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      input.removeEventListener("change", onPick);
      input.removeEventListener("input", onPick);
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("pageshow", onReturn);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ingestFromInput]);

  const onReactChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (submitting || done || uploadingRef.current) return;

    const original = fileRef.current ?? inputRef.current?.files?.[0] ?? null;
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

      const xhr = new XMLHttpRequest();
      xhr.open("POST", actionUrl);
      xhr.responseType = "text";
      xhr.setRequestHeader("Accept", "application/json");

      xhr.onload = () => {
        uploadingRef.current = false;
        setSubmitting(false);
        let data: {
          ok?: boolean;
          error?: string;
          precisionEstimada?: number;
        } = {};
        try {
          data = JSON.parse(xhr.responseText || "{}") as typeof data;
        } catch {
          data = {};
        }

        if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
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
            `No se pudo procesar la foto (${xhr.status || "red"}).`,
        );
      };

      xhr.onerror = () => {
        uploadingRef.current = false;
        setSubmitting(false);
        setError("Error de red al subir. Revisa la conexión e inténtalo de nuevo.");
      };

      xhr.send(body);
    })();
  };

  const resetAll = () => {
    uploadingRef.current = false;
    lastKeyRef.current = "";
    fileRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    setFileLabel(null);
    setHasFile(false);
    setSubmitting(false);
    setDone(false);
    setError(null);
    setPrecision(null);
  };

  return (
    <form
      action={actionUrl}
      method="post"
      encType="multipart/form-data"
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <label
        className={cn(
          "relative flex min-h-[7.5rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center",
          hasFile
            ? "border-polaria-teal bg-polaria-t-08"
            : "border-polaria-t-20 bg-polaria-bg/40",
          submitting || done ? "cursor-wait opacity-70" : "cursor-pointer",
        )}
      >
        <input
          ref={inputRef}
          name="foto"
          type="file"
          accept="image/*"
          onChange={onReactChange}
          className="absolute inset-0 z-20 m-0 h-full w-full cursor-pointer p-0"
          style={{
            opacity: 0.01,
            fontSize: 16,
            WebkitTapHighlightColor: "transparent",
            pointerEvents: submitting || done ? "none" : "auto",
          }}
          aria-label="Tomar o elegir foto"
        />
        <span className="pointer-events-none relative z-0 polaria-text-body font-semibold text-polaria-w">
          {hasFile ? "Foto seleccionada" : "Tomar o elegir foto"}
        </span>
        <span className="pointer-events-none relative z-0 polaria-text-caption text-polaria-w-50">
          {fileLabel ?? "JPG, PNG o WebP · máx. 10 MB"}
        </span>
      </label>

      {precision != null && done ? (
        <div className="rounded-xl border border-polaria-t-20 bg-polaria-bg/40 px-4 py-3 text-center">
          <p className="polaria-text-label text-polaria-w-50">
            Precisión de extracción
          </p>
          <p className="mt-1 polaria-text-card-title text-polaria-teal">
            {precision}% · {labelPrecision(precision)}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="polaria-text-caption text-polaria-w-50">
          {error}
        </p>
      ) : null}

      {!done ? (
        <button
          type="submit"
          disabled={!hasFile || submitting}
          className={cn(
            "w-full rounded-xl bg-polaria-teal px-4 py-3.5 font-semibold text-polaria-bg",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {submitting ? "Subiendo…" : "Subir y leer hoja"}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="polaria-text-body-sm text-center text-polaria-teal">
            Listo. El operador ya puede descargar el PDF actualizado.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="w-full rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 font-semibold text-polaria-w hover:opacity-90"
          >
            Subir otra foto
          </button>
        </div>
      )}

      <p className="polaria-text-caption text-center text-polaria-w-20">
        Elige la foto y luego pulsa subir.
      </p>
    </form>
  );
}
