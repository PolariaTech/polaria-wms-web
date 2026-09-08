"use client";

import { useEffect, useId, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Campo de foto con UI Polaria.
 * El input real va en el form nativo (name=foto) para que iOS suba sin React.
 */
export function CapturaOrdenFotoField() {
  const inputId = useId().replace(/:/g, "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setFileName(null);
      setPreviewUrl(null);
      return;
    }
    setFileName(file.name || "Foto seleccionada");
    setPreviewUrl(URL.createObjectURL(file));
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
          id={inputId}
          type="file"
          name="foto"
          accept="image/*"
          required
          onChange={onPick}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
          aria-label={fileName ? "Cambiar foto" : "Tomar o elegir foto"}
        />
        <span className="pointer-events-none polaria-text-body font-semibold text-polaria-teal">
          {fileName ? "Foto lista · tocar para cambiar" : "Tomar o elegir foto"}
        </span>
        <span className="pointer-events-none polaria-text-caption text-polaria-w-50">
          {fileName ?? "JPG, PNG o foto de la cámara"}
        </span>
      </div>

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
