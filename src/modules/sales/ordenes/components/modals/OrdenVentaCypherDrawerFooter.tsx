"use client";

import { FileText, Pencil, Printer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
export interface OrdenVentaCypherDrawerFooterProps {
  puedeEditar: boolean;
  puedeAlmacen: boolean;
  puedeBorrar: boolean;
  bloqueadoHastaConfirmar: string;
  busyKind: "print" | "preview" | "fotos" | "borrar" | null;
  onEdit: () => void;
  onPrint: () => void;
  onPreview: () => void;
  onBorrar?: () => void;
  onOpenBorrarConfirm: () => void;
}

export function OrdenVentaCypherDrawerFooter({
  puedeEditar,
  puedeAlmacen,
  puedeBorrar,
  bloqueadoHastaConfirmar,
  busyKind,
  onEdit,
  onPrint,
  onPreview,
  onBorrar,
  onOpenBorrarConfirm,
}: OrdenVentaCypherDrawerFooterProps) {
  return (
    <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-polaria-t-20 bg-polaria-bg/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] @md/cypher:gap-2.5 @md/cypher:px-4">
      <button
        type="button"
        title={puedeEditar ? "Editar" : bloqueadoHastaConfirmar}
        disabled={!puedeEditar}
        onClick={() => {
          if (!puedeEditar) return;
          onEdit();
        }}
        className={cn(
          "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-t-20 px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
          "polaria-text-caption font-bold text-polaria-teal transition hover:bg-polaria-t-08 @md/cypher:polaria-text-body-sm",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
        )}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        Editar
      </button>
      <button
        type="button"
        title={puedeAlmacen ? "Imprimir" : bloqueadoHastaConfirmar}
        disabled={!puedeAlmacen || busyKind === "print"}
        onClick={() => {
          if (!puedeAlmacen) return;
          onPrint();
        }}
        className={cn(
          "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-t-20 px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
          "polaria-text-caption font-bold text-polaria-teal transition hover:bg-polaria-t-08 @md/cypher:polaria-text-body-sm",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
        )}
      >
        <Printer className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        Imprimir
      </button>
      <button
        type="button"
        title={puedeAlmacen ? "Previsualizar" : bloqueadoHastaConfirmar}
        disabled={!puedeAlmacen || busyKind === "preview"}
        onClick={() => {
          if (!puedeAlmacen) return;
          onPreview();
        }}
        className={cn(
          "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-t-20 px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
          "polaria-text-caption font-bold text-polaria-teal transition hover:bg-polaria-t-08 @md/cypher:polaria-text-body-sm",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
        )}
      >
        <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        Previsualizar
      </button>
      {onBorrar ? (
        <button
          type="button"
          title={
            puedeBorrar
              ? "Cancelar orden (queda en listado como Cancelada)"
              : "Solo disponible en órdenes por confirmar"
          }
          disabled={!puedeBorrar || busyKind === "borrar"}
          aria-disabled={!puedeBorrar || busyKind === "borrar"}
          onClick={() => {
            if (!puedeBorrar || busyKind === "borrar") return;
            onOpenBorrarConfirm();
          }}
          className={cn(
            "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-danger-border px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
            "polaria-text-caption font-bold text-polaria-danger transition hover:bg-polaria-danger-bg @md/cypher:polaria-text-body-sm",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-danger",
          )}
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
          Borrar
        </button>
      ) : null}
    </footer>
  );
}
