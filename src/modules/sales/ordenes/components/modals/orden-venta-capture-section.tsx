import type { ReactNode } from "react";
import { parseFechaOrigen } from "../../utils/origen/materialize-ov-desde-origen";

export function OrdenVentaCaptureSection({
  title,
  optional,
  children,
  footer,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
      {footer}
    </section>
  );
}

export function toDateInputValue(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return parseFechaOrigen(raw) ?? "";
}
