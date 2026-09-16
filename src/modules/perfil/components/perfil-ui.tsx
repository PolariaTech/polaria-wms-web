import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function perfilInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  return (nombre.trim().charAt(0) || "?").toUpperCase();
}

export function PerfilAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const isError = tone === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-xl px-3 py-2 polaria-text-body-sm",
        isError
          ? "border border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger"
          : "border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
      )}
    >
      {children}
    </p>
  );
}

export function PerfilSection({
  icon: Icon,
  kicker,
  title,
  description,
  children,
  footer,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="polaria-card-glow overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl">
      <header className="flex items-start gap-3 border-b border-polaria-w-08 px-5 py-5 sm:px-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-polaria-t-20 bg-polaria-w-08">
          <Icon className="h-5 w-5 text-polaria-teal" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="polaria-text-label">{kicker}</p>
          <h2 className="polaria-text-card-title mt-1">{title}</h2>
          <p className="polaria-text-caption mt-1">{description}</p>
        </div>
      </header>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      {footer ? (
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-polaria-w-08 bg-polaria-w-08 px-5 py-4 sm:px-6">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

export function PerfilMetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const empty = !value.trim() || value === "—";
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-polaria-w-08 bg-polaria-w-08">
        <Icon className="h-3.5 w-3.5 text-polaria-teal" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="polaria-text-label">{label}</p>
        <p
          className={cn(
            "mt-1 truncate polaria-text-body",
            empty && "text-polaria-w-20",
          )}
          title={empty ? undefined : value}
        >
          {empty ? "Sin asignar" : value}
        </p>
      </div>
    </div>
  );
}

export const perfilPrimaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5 font-semibold text-polaria-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const perfilGhostButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-polaria-w-08 bg-transparent px-4 py-2.5 polaria-text-body-sm font-medium text-polaria-w-50 transition hover:border-polaria-t-20 hover:text-polaria-w disabled:cursor-not-allowed disabled:opacity-60";
