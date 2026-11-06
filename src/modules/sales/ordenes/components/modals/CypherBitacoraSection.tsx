"use client";

import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/components/shared/utils/formatters";
import type { OrdenVentaLogEntry } from "../../types/orden-venta-log.types";
import {
  extractLogSlaCallout,
  logEntryToneBadgeClass,
  logEntryToneDotClass,
  resolveLogEntryAutorBadge,
  resolveLogEntryTone,
} from "../../utils/ot/log-entry-tone";
import type { CypherCompanionOtPicker } from "./cypher-companion-ot.types";

export interface CypherBitacoraSectionProps {
  logLoading: boolean;
  logEntries: OrdenVentaLogEntry[];
  zonaHoraria: string;
  idOrdenTrabajoBitacora: string | null;
  activeOtPicker: CypherCompanionOtPicker | null;
}

export function CypherBitacoraSection({
  logLoading,
  logEntries,
  zonaHoraria,
  idOrdenTrabajoBitacora,
  activeOtPicker,
}: CypherBitacoraSectionProps) {
  return (
    <>
      {idOrdenTrabajoBitacora && activeOtPicker ? (
        <p className="mt-2 polaria-text-caption text-polaria-w-50">
          Eventos de{" "}
          <span className="font-semibold text-polaria-teal">
            {activeOtPicker.hijas.find((h) => h.id === idOrdenTrabajoBitacora)?.label ??
              "esta orden de trabajo"}
          </span>{" "}
          (creación, confirmación, cambios, alistamiento, etc.).
        </p>
      ) : null}
      <div className="mt-4">
        {logLoading ? (
          <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
        ) : logEntries.length === 0 ? (
          <p className="polaria-text-body-sm text-polaria-w-50">Sin eventos registrados.</p>
        ) : (
          <ul className="space-y-0">
            {logEntries.map((entry) => {
              const stamped = formatDateTime(entry.createdAt, zonaHoraria);
              const [datePart, timePart] = stamped.split(",").map((part) => part.trim());
              const tone = resolveLogEntryTone(entry);
              const autorBadge = resolveLogEntryAutorBadge(entry);
              const sla = extractLogSlaCallout(entry.mensaje);
              return (
                <li
                  key={entry.id}
                  className="grid grid-cols-[1.125rem_minmax(0,1fr)] gap-2.5 @md/cypher:grid-cols-[5.5rem_1.125rem_minmax(0,1fr)] @md/cypher:gap-3"
                >
                  <div className="hidden pt-0.5 text-right @md/cypher:block">
                    <p className="polaria-text-body-sm font-bold text-polaria-w whitespace-nowrap">
                      {timePart || stamped}
                    </p>
                    <p className="polaria-text-caption text-polaria-w-20">{datePart}</p>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="absolute inset-y-0 w-px bg-polaria-t-20" />
                    <span
                      className={cn(
                        "relative mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-polaria-bg",
                        logEntryToneDotClass(tone),
                      )}
                      title={
                        tone === "crear"
                          ? "Creación / recepción"
                          : tone === "progreso"
                            ? "Avance / confirmación"
                            : tone === "alerta"
                              ? "Alerta / fallo"
                              : tone === "aviso"
                                ? "Aviso / SLA"
                                : "Operación"
                      }
                    />
                  </div>
                  <div className="min-w-0 pb-5">
                    <p className="mb-1 polaria-text-caption text-polaria-w-50 @md/cypher:hidden">
                      <span className="font-bold text-polaria-w">{timePart || stamped}</span>
                      {datePart ? ` · ${datePart}` : null}
                    </p>
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 polaria-text-caption font-semibold",
                          logEntryToneBadgeClass(tone),
                        )}
                      >
                        {autorBadge}
                      </span>
                      <p className="min-w-0 w-full whitespace-pre-wrap break-words polaria-text-body-sm text-polaria-w">
                        {entry.mensaje}
                      </p>
                    </div>
                    {sla ? (
                      <p
                        className={cn(
                          "mt-2 rounded-lg border px-2.5 py-1.5 polaria-text-caption font-semibold",
                          sla.overLimit
                            ? "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger"
                            : "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
                        )}
                      >
                        {sla.text}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
