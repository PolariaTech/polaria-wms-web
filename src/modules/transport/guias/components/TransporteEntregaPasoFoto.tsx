"use client";

import { Camera } from "lucide-react";
import { PolariaRemoteImage } from "@/components/shared/media/PolariaRemoteImage";

interface TransporteEntregaPasoFotoProps {
  hasFoto: boolean;
  fotoPreview: string | null;
  onFotoChange: (fileList: FileList | null) => void;
}

export function TransporteEntregaPasoFoto({
  hasFoto,
  fotoPreview,
  onFotoChange,
}: TransporteEntregaPasoFotoProps) {
  return (
    <label className="flex cursor-pointer flex-col gap-3">
      <span className="flex items-center gap-2 polaria-text-body-sm font-semibold text-polaria-w">
        <Camera className="h-4 w-4 text-polaria-teal" aria-hidden />
        Evidencia de la entrega (foto) *
      </span>
      <div className="relative flex min-h-[9rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-polaria-t-20 bg-polaria-t-08 px-4 py-6">
        <span className="rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-bold text-polaria-on-teal">
          {hasFoto ? "Cambiar foto" : "Elegir archivo"}
        </span>
        <span className="mt-2 polaria-text-caption text-polaria-w-50">
          Cámara o galería · hasta 10 MB
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => onFotoChange(event.target.files)}
          aria-label="Elegir foto de evidencia"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      {fotoPreview ? (
        <PolariaRemoteImage
          src={fotoPreview}
          alt="Vista previa de evidencia"
          width={640}
          height={360}
          className="max-h-48 w-full rounded-xl border border-polaria-w-08 object-contain"
        />
      ) : null}
    </label>
  );
}
