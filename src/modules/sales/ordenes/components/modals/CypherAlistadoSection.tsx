"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { OrdenSurtidoCapturaPayload } from "../../surtido/orden-surtido.types";
import { parseCantidadPreparadaKg } from "../../surtido/sync-surtido-to-orden-venta";
import { filterLineasByOrdenTrabajoHija } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import {
  normalizeIdOrdenTrabajo,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

type CapturaApiRow = {
  idOrdenTrabajo?: string;
  payload?: OrdenSurtidoCapturaPayload;
  urlFoto?: string | null;
  updatedAt?: string;
};

function campoCaptura(
  campos: Record<string, string> | undefined,
  ...keys: string[]
): string {
  if (!campos) return "";
  for (const key of keys) {
    const direct = campos[key]?.trim();
    if (direct) return direct;
  }
  const lower = Object.fromEntries(
    Object.entries(campos).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    const value = lower[key.toLowerCase()]?.trim();
    if (value) return value;
  }
  return "";
}

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

  const capturaByOt = useMemo(() => {
    const map = new Map<string, CapturaApiRow>();
    for (const row of capturas) {
      const key = normalizeIdOrdenTrabajo(row.idOrdenTrabajo);
      if (!map.has(key)) map.set(key, row);
    }
    return map;
  }, [capturas]);

  const ots = useMemo(() => {
    if (hijas.length > 0) return [...hijas];
    return [
      {
        id: "",
        label: orden.centro_consumo?.trim() || "Orden de trabajo",
        numeroPedido: orden.orden_compra_hotel?.trim() || "",
        almacen: orden.centro_consumo?.trim() || "",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "",
        renglones: [],
        totalCantidad: 0,
      } satisfies OrdenTrabajoHija,
    ];
  }, [hijas, orden.centro_consumo, orden.orden_compra_hotel]);

  const filas = useMemo(() => {
    return ots.map((hija, index) => {
      const otKey = normalizeIdOrdenTrabajo(hija.id);
      const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
      const destino =
        hija.almacen?.trim() ||
        hija.label.split("—").slice(1).join("—").trim() ||
        hija.label ||
        orden.direccion_entrega?.trim() ||
        "—";
      const despacho = campoCaptura(
        captura?.payload?.campos,
        "despachoNombre",
        "Despachó nombre",
        "Despachó",
      );
      return {
        key: hija.id || `ot-${index}`,
        otLabel: `OT ${index + 1}`,
        destino,
        despacho: despacho || "—",
        fecha: captura?.updatedAt ?? null,
      };
    });
  }, [capturaByOt, orden.direccion_entrega, ots]);

  const cerradoAt = useMemo(() => {
    const times = capturas
      .map((row) => Date.parse(row.updatedAt ?? ""))
      .filter((t) => Number.isFinite(t));
    if (times.length === 0) {
      return (
        orden.estado_desde?.trim() ||
        orden.updated_at?.trim() ||
        orden.created_at?.trim() ||
        null
      );
    }
    return new Date(Math.max(...times)).toISOString();
  }, [capturas, orden.created_at, orden.estado_desde, orden.updated_at]);

  const resumenLineas = useMemo(() => {
    let completas = 0;
    let parciales = 0;
    let noSurtidas = 0;
    let conDatoPrep = 0;
    let totalLineas = 0;

    for (const hija of ots) {
      const otKey = normalizeIdOrdenTrabajo(hija.id);
      const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
      const lineasOt = filterLineasByOrdenTrabajoHija(
        orden.lineas ?? [],
        hija.renglones.length > 0 ? hija : null,
        { emptyFallback: hija.renglones.length === 0 ? "all" : "none" },
      );
      totalLineas += lineasOt.length;

      lineasOt.forEach((linea, lineaIndex) => {
        const prepRaw = captura?.payload?.lineas?.find(
          (row) => row.indice === lineaIndex + 1,
        )?.cantidadPreparada;
        const prep = parseCantidadPreparadaKg(prepRaw);
        if (prep == null) {
          noSurtidas += 1;
          return;
        }
        conDatoPrep += 1;
        const pedida = Number(linea.cantidad_pedida) || 0;
        if (pedida <= 0) {
          if (prep > 0) completas += 1;
          else noSurtidas += 1;
          return;
        }
        if (prep <= 0) {
          noSurtidas += 1;
          return;
        }
        if (prep + 1e-6 >= pedida) completas += 1;
        else parciales += 1;
      });
    }

    // Solo mostrar tarjetas si hay al menos una cantidad preparada leída.
    if (conDatoPrep === 0) return null;
    return { completas, parciales, noSurtidas, totalLineas };
  }, [capturaByOt, orden.lineas, ots]);

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
