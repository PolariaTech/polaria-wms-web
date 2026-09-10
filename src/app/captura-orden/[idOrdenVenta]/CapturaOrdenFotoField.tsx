"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { cn } from "@/lib/utils/cn";
import {
  assignFileToInput,
  compressImageFile,
} from "@/lib/images/compress-image-file";

/**
 * Campo de foto con UI Polaria.
 * Comprime la imagen en el cliente (evita 413 en Vercel) y deja el File
 * en el input name=foto para el POST multipart nativo.
 *
 * Dos acciones explícitas: cámara (`capture`) o galería (sin `capture`).
 * Un solo input con name=foto alimenta el submit nativo del form.
 */
export function CapturaOrdenFotoField() {
  const inputId = useId().replace(/:/g, "");
  const inputRef = useRef<HTMLInputElement>(null);
  const compressingRef = useRef(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "compressing" | "ready">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form) return;

    const onSubmit = (event: Event) => {
      const file = input.files?.[0];
      if (!file) return;

      if (compressingRef.current) {
        event.preventDefault();
        setError("Espera a que termine de preparar la foto.");
        return;
      }

      if (file.size > 3 * 1024 * 1024) {
        event.preventDefault();
        compressingRef.current = true;
        setStatus("compressing");
        setError(null);
        void (async () => {
          try {
            const compressed = await compressImageFile(file);
            assignFileToInput(input, compressed);
            setFileName(
              `${compressed.name} · ${(compressed.size / (1024 * 1024)).toFixed(1)} MB`,
            );
            setStatus("ready");
            compressingRef.current = false;
            form.requestSubmit();
          } catch {
            compressingRef.current = false;
            setStatus("idle");
            setError(
              "No se pudo preparar la foto. Prueba otra o bájalas de resolución.",
            );
          }
        })();
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  const openPicker = (mode: "camera" | "gallery") => {
    const input = inputRef.current;
    if (!input || status === "compressing") return;
    if (mode === "camera") {
      input.setAttribute("capture", "environment");
    } else {
      input.removeAttribute("capture");
    }
    input.click();
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFileName(null);
      setStatus("idle");
      compressingRef.current = false;
      return;
    }

    compressingRef.current = true;
    setStatus("compressing");
    setFileName("Preparando foto…");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    void (async () => {
      try {
        const compressed = await compressImageFile(file);
        assignFileToInput(input, compressed);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(compressed);
        });
        setFileName(
          `${compressed.name} · ${(compressed.size / (1024 * 1024)).toFixed(1)} MB`,
        );
        setStatus("ready");
        compressingRef.current = false;
      } catch {
        compressingRef.current = false;
        setStatus("idle");
        setFileName(file.name || "Foto seleccionada");
        setError(
          "No se pudo comprimir. Si falla al subir, usa una foto más liviana.",
        );
      }
    })();
  };

  const busy = status === "compressing";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name="foto"
        accept="image/*"
        required
        disabled={busy}
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      <div
        className={cn(
          "flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-6 text-center",
          fileName
            ? "border-polaria-teal bg-polaria-t-08"
            : "border-polaria-t-20 bg-polaria-bg/50",
        )}
      >
        <span className="polaria-text-body font-semibold text-polaria-teal">
          {busy
            ? "Preparando foto…"
            : fileName
              ? "Foto lista"
              : "Foto de la hoja"}
        </span>
        <span className="polaria-text-caption text-polaria-w-50">
          {busy
            ? "Reduciendo tamaño para subir…"
            : (fileName ?? "Tómala ahora o elige una de la galería")}
        </span>

        <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => openPicker("camera")}
            className="flex-1 rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-bg hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            Tomar foto
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => openPicker("gallery")}
            className="flex-1 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 font-semibold text-polaria-w hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {fileName ? "Elegir otra" : "Subir de galería"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="polaria-text-caption text-polaria-w-50">
          {error}
        </p>
      ) : null}

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Vista previa"
          className="max-h-72 w-full rounded-xl border border-polaria-w-08 object-contain"
        />
      ) : null}
    </div>
  );
}
