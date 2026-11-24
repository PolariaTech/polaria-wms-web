"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  buildCapturaByOtMap,
  buildFilasAlistado,
  buildResumenLineasAlistado,
  resolveCerradoAtAlistado,
  resolveOtsAlistado,
  type CapturaApiRow,
} from "./CypherAlistadoSection-helpers";

export interface CypherAlistadoSectionProps {
  idOrdenVenta: string;
  orden: OrdenVentaDetalleRow;
  hijas: readonly OrdenTrabajoHija[];
}

export function CypherAlistadoSection({
  idOrdenVenta,
  orden,
  hijas,
}: CypherAlistadoSectionProps) {
  const [capturas, setCapturas] = useState<CapturaApiRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      `/captura-orden/${encodeURIComponent(idOrdenVenta)}/api?all=1`,
    )
      .then(async (response) => {
        if (!response.ok) return [] as CapturaApiRow[];
        const body = (await response.json()) as {
          capturas?: CapturaApiRow[];
        };
        return body.capturas ?? [];
      })
      .then((rows) => {
        if (!cancelled) setCapturas(rows);
      })
      .catch(() => {
        if (!cancelled) setCapturas([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrdenVenta]);

  const capturaByOt = useMemo(
    () => buildCapturaByOtMap(capturas),
    [capturas],
  );

  const ots = useMemo(
    () => resolveOtsAlistado(hijas, orden),
    [hijas, orden],
  );

  const filas = useMemo(
    () => buildFilasAlistado(ots, capturaByOt, orden.direccion_entrega),
    [capturaByOt, orden.direccion_entrega, ots],
  );

  const cerradoAt = useMemo(
    () => resolveCerradoAtAlistado(capturas, orden),
    [capturas, orden],
  );

  const resumenLineas = useMemo(
    () => buildResumenLineasAlistado(ots, capturaByOt, orden.lineas),
    [capturaByOt, orden.lineas, ots],
  );

  if (loading) {
    return (
      <p className="mt-3 polaria-text-caption text-polaria-w-50">
        Cargando alistado…
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3 @md/cypher:flex-row @md/cypher:flex-wrap @md/cypher:items-center @md/cypher:justify-between @md/cypher:px-4 @md/cypher:py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-polaria-teal bg-polaria-t-20 text-polaria-teal"
            aria-hidden
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <p className="polaria-text-body-sm font-bold text-polaria-w">
            Todas las OTs fueron escaneadas
          </p>
        </div>
        {cerradoAt ? (
          <p className="pl-10 polaria-text-caption text-polaria-w-50 @md/cypher:pl-0">
            {formatDateTime(cerradoAt)}
          </p>
        ) : null}
      </div>

      {/* Tarjetas apiladas: en panel angosto la tabla de 4 cols se aplastaba. */}
      <ul className="space-y-2.5">
        {filas.map((fila) => (
          <li
            key={fila.key}
            className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3"
          >
            <p className="polaria-text-caption font-bold tracking-wide text-polaria-teal">
              {fila.otLabel}
            </p>
            <dl className="mt-2.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2">
              <dt className="polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                DESTINO
              </dt>
              <dd className="min-w-0 break-words polaria-text-body-sm text-polaria-w">
                {fila.destino}
              </dd>
              <dt className="polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                FIRMÓ
              </dt>
              <dd
                className={cn(
                  "min-w-0 break-words text-polaria-w",
                  fila.despacho !== "—"
                    ? "font-serif text-base italic"
                    : "polaria-text-caption text-polaria-w-50",
                )}
              >
                {fila.despacho}
              </dd>
              <dt className="polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                FECHA
              </dt>
              <dd className="min-w-0 break-words polaria-text-caption text-polaria-w">
                {fila.fecha ? formatDateTime(fila.fecha) : "—"}
              </dd>
            </dl>
          </li>
        ))}
      </ul>

      {resumenLineas ? (
        <div
          className={cn(
            "grid gap-2.5",
            /* Container del panel Cypher (~20–38rem), no el viewport. */
            resumenLineas.parciales > 0
              ? "grid-cols-1 @xl/cypher:grid-cols-3"
              : "grid-cols-1 @md/cypher:grid-cols-2",
          )}
        >
          <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3">
            <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
              SURTIDAS COMPLETAS
            </p>
            <p className="mt-2 flex flex-wrap items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-polaria-w">
                {resumenLineas.completas}
              </span>
              <span className="polaria-text-caption text-polaria-w-50">
                de {resumenLineas.totalLineas} líneas
              </span>
            </p>
          </div>

          {resumenLineas.parciales > 0 ? (
            <div className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-3">
              <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                PARCIALES
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-polaria-warning">
                {resumenLineas.parciales}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-3 py-3">
            <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
              NO SURTIDAS
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-polaria-danger">
              {resumenLineas.noSurtidas}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
