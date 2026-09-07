import type { ReactNode } from "react";
import { Ban, CheckCircle2, Download, Pencil, Printer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PolariaTableCode({ children }: { children: ReactNode }) {
  return (
    <span className="font-medium text-polaria-teal">{children}</span>
  );
}

interface PolariaTableBadgeProps {
  children: ReactNode;
  variant?: "positive" | "neutral" | "warning";
}

export function PolariaTableBadge({
  children,
  variant = "positive",
}: PolariaTableBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2.5 py-1 polaria-text-badge",
        variant === "positive"
          ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
          : variant === "warning"
            ? "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning"
            : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50",
      )}
    >
      {children}
    </span>
  );
}

const ICON_ACTION_CLASS = cn(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
  "hover:bg-polaria-t-08",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** Agrupa acciones de fila siempre en horizontal. */
export function PolariaTableActionGroup({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex flex-nowrap items-center gap-2 whitespace-nowrap">
      {children}
    </span>
  );
}

interface PolariaTableEditButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function PolariaTableEditButton({
  label = "Editar",
  onClick,
  disabled = false,
}: PolariaTableEditButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(ICON_ACTION_CLASS, disabled && "cursor-not-allowed opacity-50")}
    >
      <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

interface PolariaTableDisableButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/** Baja lógica: deja de aparecer en formularios, sigue visible en tablas. */
export function PolariaTableDisableButton({
  label = "Deshabilitar",
  onClick,
  disabled = false,
}: PolariaTableDisableButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(ICON_ACTION_CLASS, disabled && "cursor-not-allowed opacity-50")}
    >
      <Ban className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

interface PolariaTableEnableButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/** Reactiva un registro deshabilitado para que vuelva a formularios. */
export function PolariaTableEnableButton({
  label = "Habilitar",
  onClick,
  disabled = false,
}: PolariaTableEnableButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(ICON_ACTION_CLASS, disabled && "cursor-not-allowed opacity-50")}
    >
      <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

interface PolariaTableDeleteButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function PolariaTableDeleteButton({
  label = "Eliminar",
  onClick,
  disabled = false,
}: PolariaTableDeleteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-polaria-warning-border px-3 py-1.5",
        "polaria-text-body-sm text-polaria-warning transition hover:bg-polaria-warning-bg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-warning focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}

interface PolariaTablePrintButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function PolariaTablePrintButton({
  label = "Imprimir",
  onClick,
  disabled = false,
}: PolariaTablePrintButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
        "hover:bg-polaria-t-08",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

interface PolariaTableDownloadButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function PolariaTableDownloadButton({
  label = "Descargar",
  onClick,
  disabled = false,
}: PolariaTableDownloadButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
        "hover:bg-polaria-t-08",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
