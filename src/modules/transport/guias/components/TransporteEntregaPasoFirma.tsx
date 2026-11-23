"use client";

import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { PenLine } from "lucide-react";

interface TransporteEntregaPasoFirmaProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onClear: () => void;
}

export function TransporteEntregaPasoFirma({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClear,
}: TransporteEntregaPasoFirmaProps) {
  return (
    <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3">
      <p className="mb-2 flex items-center gap-2 polaria-text-body-sm font-semibold text-polaria-w">
        <PenLine className="h-4 w-4 text-polaria-teal" aria-hidden />
        Firma de quien recibe *
      </p>
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="w-full touch-none rounded-xl border border-polaria-w-08 bg-polaria-w"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <button
        type="button"
        onClick={onClear}
        className="mt-2 rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-3 py-2 polaria-text-caption font-medium text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal"
      >
        Limpiar firma
      </button>
    </div>
  );
}
