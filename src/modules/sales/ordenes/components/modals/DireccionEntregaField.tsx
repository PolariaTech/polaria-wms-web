"use client";

import { MapPin } from "lucide-react";
import { useState, type ChangeEventHandler, type ReactNode } from "react";
import { POLARIA_FORM_INPUT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import {
  EntregaMapaModal,
  type EntregaMapaConfirmacion,
} from "./EntregaMapaModal";

type DireccionEntregaFieldProps = {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  controlClassName?: string;
  footer?: ReactNode;
  /** REQ-251: coordenadas persistidas / pendientes de guardar. */
  entregaLat?: number | null;
  entregaLng?: number | null;
  onEntregaCoords?: (coords: { lat: number; lng: number } | null) => void;
  onDireccionFromMapa?: (direccion: string) => void;
  /** Solo lectura (detalle): abre mapa en modo ver. */
  soloLectura?: boolean;
};

/** Dirección de entrega a ancho completo, textarea + mapa (REQ-217 / REQ-251). */
export function DireccionEntregaField({
  id,
  value,
  onChange,
  controlClassName,
  footer,
  entregaLat = null,
  entregaLng = null,
  onEntregaCoords,
  onDireccionFromMapa,
  soloLectura = false,
}: DireccionEntregaFieldProps) {
  const [mapaOpen, setMapaOpen] = useState(false);

  function handleConfirm(confirmacion: EntregaMapaConfirmacion) {
    onDireccionFromMapa?.(confirmacion.direccion);
    onEntregaCoords?.({ lat: confirmacion.lat, lng: confirmacion.lng });
  }

  return (
    <div className="sm:col-span-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapaOpen(true)}
            aria-label="Abrir mapa de dirección de entrega"
            title="Ubicar en el mapa"
            className="inline-flex shrink-0 rounded-md border border-polaria-t-20 bg-polaria-t-08 p-1 text-polaria-teal transition hover:bg-polaria-t-20"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
          </button>
          <label
            htmlFor={soloLectura ? undefined : id}
            className="text-xs font-medium text-polaria-w"
          >
            Dirección de entrega
          </label>
        </div>
        {soloLectura ? (
          <button
            type="button"
            onClick={() => setMapaOpen(true)}
            className="w-full rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 text-left text-sm text-polaria-w hover:border-polaria-t-20"
          >
            <span className="whitespace-pre-wrap">
              {value.trim() || "—"}
            </span>
          </button>
        ) : (
          <textarea
            id={id}
            value={value}
            rows={3}
            onChange={onChange}
            className={cn(
              POLARIA_FORM_INPUT_CLASS_COMPACT,
              "min-h-[4.5rem] resize-y leading-relaxed",
              controlClassName,
            )}
          />
        )}
      </div>
      {footer}
      <EntregaMapaModal
        open={mapaOpen}
        onClose={() => setMapaOpen(false)}
        direccionInicial={value}
        latInicial={entregaLat}
        lngInicial={entregaLng}
        modo={soloLectura ? "ver" : "editar"}
        onConfirm={soloLectura ? undefined : handleConfirm}
      />
    </div>
  );
}
