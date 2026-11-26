import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

/** REQ-371: lo mínimo que necesita del aviso de total (db = «Solicitud $X»). */
export type AvisoTotalOc = { db: string };

export function textoTooltipTotalOv(aviso: AvisoTotalOc): string {
  return `Verifica el valor: el total de la OV es diferente al de la OC (${aviso.db}).`;
}

/**
 * REQ-371: resalta en amarillo el total de la OV cuando no coincide con el
 * total de la OC. Sin aviso, devuelve el valor tal cual.
 */
export function TotalOvConAviso({
  aviso,
  children,
}: {
  aviso?: AvisoTotalOc | null;
  children: ReactNode;
}) {
  if (!aviso) return <>{children}</>;

  const tooltip = textoTooltipTotalOv(aviso);

  return (
    <span
      data-total-ov-aviso=""
      title={tooltip}
      aria-label={tooltip}
      className="inline-flex items-center gap-1 rounded-md border border-polaria-warning-border bg-polaria-warning-bg px-1.5 py-0.5 text-polaria-warning"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
