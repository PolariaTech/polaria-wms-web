"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

export interface OrdenVentaDetalleSectionProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/** Sección con borde del detalle de venta; opcionalmente plegable. */
export function OrdenVentaDetalleSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: OrdenVentaDetalleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left polaria-text-label uppercase tracking-wide text-polaria-teal"
          aria-expanded={open}
        >
          <span>{title}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>
        {open ? (
          <div className="border-t border-polaria-w-08 p-4">{children}</div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        {title}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}
