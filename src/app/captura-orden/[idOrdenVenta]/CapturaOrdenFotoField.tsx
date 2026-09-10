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

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative flex min-h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed px-4 py-8 text-center",
          fileName
            ? "border-polaria-teal bg-polaria-t-08"
            : "border-polaria-t-20 bg-polaria-bg/50",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name="foto"
          accept="image/*"
          capture="environment"
          required
          disabled={status === "compressing"}
          onChange={onPick}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
          aria-label={fileName ? "Cambiar foto" : "Tomar o elegir foto"}
        />
        <span className="pointer-events-none polaria-text-body font-semibold text-polaria-teal">
          {status === "compressing"
            ? "Preparando foto…"
            : fileName
              ? "Foto lista · tocar para cambiar"
              : "Tomar o elegir foto"}
        </span>
        <span className="pointer-events-none polaria-text-caption text-polaria-w-50">
          {status === "compressing"
            ? "Reduciendo tamaño para subir…"
            : (fileName ?? "JPG, PNG o foto de la cámara")}
        </span>
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
