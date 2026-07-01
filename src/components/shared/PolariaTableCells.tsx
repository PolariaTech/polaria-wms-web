import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

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

interface PolariaTableEditButtonProps {
  label?: string;
  onClick?: () => void;
}

export function PolariaTableEditButton({
  label = "Editar",
  onClick,
}: PolariaTableEditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-polaria-teal px-3 py-1.5",
        "polaria-text-body-sm text-polaria-teal transition hover:bg-polaria-t-08",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {label}
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
