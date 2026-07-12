import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface JefeBodegaModalSectionProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

export function JefeBodegaModalSection({
  icon: Icon,
  label,
  children,
}: JefeBodegaModalSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-polaria-teal" strokeWidth={1.75} aria-hidden />
        <h3 className="polaria-text-label text-polaria-w-50">{label}</h3>
      </div>
      {children}
    </section>
  );
}

interface JefeBodegaModalSearchFieldProps {
  id: string;
  value?: string;
  placeholder: string;
  readOnly?: boolean;
  ariaLabel?: string;
  onSearchClick?: () => void;
}

export function JefeBodegaModalSearchField({
  id,
  value = "",
  placeholder,
  readOnly = true,
  ariaLabel,
  onSearchClick,
}: JefeBodegaModalSearchFieldProps) {
  return (
    <div className="relative flex items-stretch">
      <input
        id={id}
        type="text"
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-3 pl-4",
          onSearchClick ? "pr-12" : "pr-4",
          "text-polaria-w placeholder:text-polaria-w-20 outline-none",
          "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
        )}
      />
      {onSearchClick ? (
        <button
          type="button"
          onClick={onSearchClick}
          aria-label={`Buscar ${ariaLabel ?? placeholder}`}
          className={cn(
            "absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg",
            "border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal transition hover:bg-polaria-t-08",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
          )}
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

interface JefeBodegaModalNoticeProps {
  children: ReactNode;
}

export function JefeBodegaModalNotice({ children }: JefeBodegaModalNoticeProps) {
  return (
    <p
      role="status"
      className={cn(
        "flex gap-2 rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2.5",
        "polaria-text-body-sm text-polaria-w",
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-polaria-warning"
        aria-hidden
      />
      <span>{children}</span>
    </p>
  );
}

export function JefeBodegaModalHint({ children }: { children: ReactNode }) {
  return <p className="polaria-text-caption text-polaria-w-50">{children}</p>;
}
