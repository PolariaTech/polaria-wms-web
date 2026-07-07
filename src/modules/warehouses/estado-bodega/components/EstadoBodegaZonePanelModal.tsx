"use client";

import { useEffect, useId } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import type { EstadoBodegaZonePanelKind } from "../constants/estado-bodega-zone-panel";
import {
  ESTADO_BODEGA_ZONE_ALERTAS_DESCRIPTION,
  ESTADO_BODEGA_ZONE_TAREAS_DESCRIPTION,
} from "../constants/estado-bodega-zone-panel";
import type { EstadoBodegaZonePanelItem } from "../utils/estado-bodega-zone-panel";

const PANEL_META: Record<
  EstadoBodegaZonePanelKind,
  { label: string; icon: LucideIcon }
> = {
  alertas: {
    label: "Alertas",
    icon: AlertTriangle,
  },
  tareas: {
    label: "Tareas pendientes",
    icon: ClipboardList,
  },
};

interface EstadoBodegaZonePanelModalProps {
  open: boolean;
  onClose: () => void;
  kind: EstadoBodegaZonePanelKind;
  sectionId: EstadoBodegaSectionId;
  sectionTitle: string;
  items: EstadoBodegaZonePanelItem[];
  isLoading?: boolean;
}

export function EstadoBodegaZonePanelModal({
  open,
  onClose,
  kind,
  sectionId,
  sectionTitle,
  items,
  isLoading = false,
}: EstadoBodegaZonePanelModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const meta = PANEL_META[kind];
  const Icon = meta.icon;
  const description =
    kind === "alertas"
      ? ESTADO_BODEGA_ZONE_ALERTAS_DESCRIPTION[sectionId]
      : ESTADO_BODEGA_ZONE_TAREAS_DESCRIPTION[sectionId];

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="polaria-aurora pointer-events-none absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm"
        aria-hidden
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="polaria-card-glow relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50 transition hover:border-polaria-t-20 hover:text-polaria-w"
          aria-label="Cerrar panel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <header className="border-b border-polaria-w-08 px-5 pb-4 pt-5 pr-14">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-polaria-t-20 bg-polaria-t-08">
              <Icon className="h-5 w-5 text-polaria-teal" aria-hidden />
            </div>

            <div className="min-w-0">
              <p className="polaria-text-label text-polaria-teal">{meta.label}</p>
              <h2
                id={titleId}
                className="mt-1 polaria-text-card-title text-polaria-w"
              >
                {sectionTitle}
              </h2>
              <p
                id={descriptionId}
                className="mt-1 polaria-text-caption text-polaria-w-50"
              >
                {description}
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-[12rem] flex-1 px-5 py-6">
          {isLoading ? (
            <p className="text-center polaria-text-body-sm text-polaria-w-50">
              Cargando…
            </p>
          ) : items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-polaria-w-08 bg-polaria-bg px-3 py-2.5"
                >
                  <p className="polaria-text-body-sm text-polaria-w">
                    {item.title}
                  </p>
                  {item.subtitle ? (
                    <p className="mt-1 polaria-text-caption text-polaria-w-50">
                      {item.subtitle}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center polaria-text-body-sm text-polaria-w-50">
              No hay{" "}
              <span className="font-medium text-polaria-w">elementos</span> para
              mostrar en esta zona.
            </p>
          )}
        </div>

        <footer className="border-t border-polaria-w-08 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-2.5",
              "polaria-text-body-sm font-medium text-polaria-w transition hover:border-polaria-t-20",
            )}
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}
