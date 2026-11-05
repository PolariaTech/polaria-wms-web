import { CheckCircle2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type TipoMensajeBatch = "ok" | "aviso" | "error";

/** Resultado de la última acción: verde si salió bien, ámbar si quedó en espera, rojo si falló. */
export function ImpresionBatchMensaje({
  tipo,
  children,
}: {
  tipo: TipoMensajeBatch;
  children: ReactNode;
}) {
  const Icono = tipo === "ok" ? CheckCircle2 : TriangleAlert;
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "polaria-text-body-sm flex shrink-0 items-start gap-2 rounded-xl border px-4 py-3",
        tipo === "ok" && "border-polaria-t-20 bg-polaria-t-08 text-polaria-w",
        tipo === "aviso" &&
          "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning",
        tipo === "error" &&
          "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger",
      )}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
