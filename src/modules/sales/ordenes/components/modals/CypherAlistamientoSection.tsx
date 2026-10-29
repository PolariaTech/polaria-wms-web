"use client";

import { Check, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs } from "@/lib/utils/decimal-es";
import type { OrdenSurtidoCapturaPayload } from "../../surtido/orden-surtido.types";
import { notaCapturaForLinea } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { filterLineasByOrdenTrabajoHija } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import {
  normalizeIdOrdenTrabajo,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import { resolveOrdenVentaLineaTitulo } from "../../utils/display/orden-venta-display";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

function CheckMark({ ok }: { ok: boolean }) {
  if (!ok) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-polaria-w-20 text-polaria-w-20">
        —
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
      aria-label="Marcado"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

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

function formatElapsedSince(iso: string | null | undefined, now: number): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const diffMs = Math.max(0, now - then);
  const totalMin = Math.floor(diffMs / 60_000);
  if (totalMin < 1) return "hace un momento";
  if (totalMin < 60) return `hace ${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 48) {
    return mins > 0 ? `hace ${hours} h ${mins} min` : `hace ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export interface CypherAlistamientoSectionProps {
  idOrdenVenta: string;
  orden: OrdenVentaDetalleRow;
  hijas: readonly OrdenTrabajoHija[];
  onVerFotosOt?: (idOrdenTrabajo: string) => void;
}

export function CypherAlistamientoSection({
  idOrdenVenta,
  orden,
  hijas,
  onVerFotosOt,
}: CypherAlistamientoSectionProps) {
  const [capturas, setCapturas] = useState<CapturaApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

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

  const escaneadas = ots.filter((ot) =>
    capturaByOt.has(normalizeIdOrdenTrabajo(ot.id)),
  ).length;

  let lineasAlistoTotal = 0;
  let lineasProductoTotal = 0;
  for (const hija of ots) {
    const otKey = normalizeIdOrdenTrabajo(hija.id);
    const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
    const lineasOt = filterLineasByOrdenTrabajoHija(
      orden.lineas ?? [],
      hija.renglones.length > 0 ? hija : null,
      { emptyFallback: hija.renglones.length === 0 ? "all" : "none" },
    );
    lineasProductoTotal += lineasOt.length;
    for (let i = 0; i < lineasOt.length; i += 1) {
      const row = captura?.payload?.lineas?.find(
        (linea) => linea.indice === i + 1,
      );
      if (row?.alisto === true) lineasAlistoTotal += 1;
    }
  }

  const impresaAt =
    orden.estado_desde?.trim() ||
    orden.updated_at?.trim() ||
    orden.created_at?.trim() ||
    null;

  if (loading) {
    return (
      <p className="mt-3 polaria-text-caption text-polaria-w-50">
        Cargando alistamiento…
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        <span className="font-semibold text-polaria-teal">
          {escaneadas} de {ots.length}
        </span>{" "}
        OT{ots.length === 1 ? "" : "s"} escaneada{ots.length === 1 ? "" : "s"}
        {lineasProductoTotal > 0 ? (
          <>
            {" · "}
            <span className="font-semibold text-polaria-teal">
              {lineasAlistoTotal} de {lineasProductoTotal}
            </span>{" "}
            líneas con Alistó
          </>
        ) : null}
      </p>

      {lineasProductoTotal > 0 &&
      lineasAlistoTotal < lineasProductoTotal &&
      [...capturaByOt.values()].some(
        (c) => (c.payload?.precisionEstimada ?? 0) >= 60,
      ) ? (
        <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-caption text-polaria-warning">
          La lectura parece confiable, pero faltan chulos Alistó en algunas
          filas. Revisa la foto o vuelve a capturar esa OT.
        </p>
      ) : null}

      {ots.map((hija, index) => {
        const otKey = normalizeIdOrdenTrabajo(hija.id);
        const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
        const escaneada = Boolean(captura);
        const cocina =
          hija.almacen?.trim() ||
          hija.label.split("—").slice(1).join("—").trim() ||
          hija.label ||
          "Cocina";
        const lineasOt = filterLineasByOrdenTrabajoHija(
          orden.lineas ?? [],
          hija.renglones.length > 0 ? hija : null,
          { emptyFallback: hija.renglones.length === 0 ? "all" : "none" },
        );
        const payload = captura?.payload;
        const despachoNombre = campoCaptura(
          payload?.campos,
          "despachoNombre",
          "Despachó nombre",
          "Despachó",
        );
        const folio = campoCaptura(
          payload?.campos,
          "facturaOkFolio",
          "facturaAsociada",
          "Folio factura asociada",
          "Factura (OK) folio",
          "Folio",
        );
        const escaneoAt = captura?.updatedAt ?? null;
        const notasLineas = orden.notas_lineas?.trim() || "";

        return (
          <article
            key={hija.id || `ot-${index}`}
            className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08"
          >
            <header className="flex flex-wrap items-start justify-between gap-2 border-b border-polaria-w-08 px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className="inline-flex shrink-0 items-center rounded-lg bg-polaria-teal px-2 py-1 text-xs font-bold leading-none"
                  style={{ color: "#000000" }}
                >
                  OT {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="polaria-text-body-sm font-semibold text-polaria-w">
                    {cocina}
                  </p>
                  {orden.direccion_entrega?.trim() ? (
                    <p className="mt-0.5 line-clamp-2 polaria-text-caption text-polaria-w-50">
                      {orden.direccion_entrega.trim()}
                    </p>
                  ) : null}
                </div>
              </div>
              {escaneada ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-t-20 bg-polaria-bg/60 px-2.5 py-1 polaria-text-caption font-semibold text-polaria-teal">
                  <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
                  Escaneada
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-polaria-danger-border px-2.5 py-1 polaria-text-caption font-semibold text-polaria-danger">
                  Impresa, sin escanear
                </span>
              )}
            </header>

            {escaneada ? (
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_11.5rem]">
                <div className="min-w-0 overflow-x-auto overscroll-x-contain">
                  <table className="w-max min-w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-polaria-w-08">
                        <th className="whitespace-nowrap px-3 py-2 polaria-text-caption font-bold tracking-wide text-polaria-w-20 sm:px-4">
                          PRODUCTO
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                          PEDIDA
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 polaria-text-caption font-bold tracking-wide text-polaria-w-20 sm:px-4">
                          ESPECIFICACIÓN
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-center polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                          ALISTÓ
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-center polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                          REVISÓ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineasOt.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="whitespace-nowrap px-3 py-4 polaria-text-caption text-polaria-w-50 sm:px-4"
                          >
                            Sin productos en esta OT.
                          </td>
                        </tr>
                      ) : (
                        lineasOt.map((linea, lineaIndex) => {
                          const nombre = resolveOrdenVentaLineaTitulo(linea);
                          const capturaLinea = payload?.lineas?.find(
                            (row) => row.indice === lineaIndex + 1,
                          );
                          // REQ-124: Especificación del pedido (notas_lineas), no del manuscrito.
                          const comentario =
                            notaCapturaForLinea(notasLineas, {
                              nombre,
                              cantidad: linea.cantidad_pedida,
                              otId: hija.id || null,
                              idProducto: linea.id_producto,
                              allowUnscoped: ots.length <= 1,
                            }) || "—";
                          return (
                            <tr
                              key={linea.id_linea_orden_venta}
                              className="border-b border-polaria-w-08 last:border-b-0"
                            >
                              <td className="whitespace-nowrap px-3 py-2.5 polaria-text-body-sm text-polaria-w sm:px-4">
                                {nombre}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2.5 text-right polaria-text-body-sm tabular-nums text-polaria-w">
                                {formatKgEs(linea.cantidad_pedida)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 polaria-text-caption text-polaria-w-50 sm:px-4">
                                {comentario}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2.5 text-center">
                                <CheckMark ok={capturaLinea?.alisto === true} />
                              </td>
                              <td className="whitespace-nowrap px-2 py-2.5 text-center">
                                <CheckMark ok={capturaLinea?.reviso === true} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <aside className="flex flex-col gap-3 border-t border-polaria-w-08 px-3 py-3 lg:border-l lg:border-t-0 sm:px-4">
                  <div className="relative overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-bg">
                    {captura?.urlFoto ? (
                      <img
                        src={captura.urlFoto}
                        alt="Hoja escaneada"
                        className="h-24 w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center px-2 text-center polaria-text-caption text-polaria-w-50">
                        {despachoNombre || "Sin vista de firma"}
                      </div>
                    )}
                    {captura?.urlFoto && onVerFotosOt && otKey ? (
                      <button
                        type="button"
                        onClick={() => onVerFotosOt(otKey)}
                        className="absolute bottom-1.5 right-1.5 rounded-md bg-polaria-bg/90 px-2 py-0.5 polaria-text-caption font-bold text-polaria-teal"
                      >
                        VER
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                      FOLIO
                    </p>
                    <p className="mt-1 whitespace-nowrap polaria-text-body-sm font-semibold text-polaria-w">
                      {folio || "—"}
                    </p>
                    <p className="mt-0.5 whitespace-nowrap polaria-text-caption text-polaria-w-50">
                      Folio manuscrito en la OV
                    </p>
                  </div>

                  <div>
                    <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                      DESPACHÓ
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-polaria-w",
                        despachoNombre
                          ? "font-serif text-lg italic leading-tight"
                          : "polaria-text-caption text-polaria-w-50",
                      )}
                    >
                      {despachoNombre || "Sin nombre en la hoja"}
                    </p>
                    <p className="mt-0.5 polaria-text-caption text-polaria-w-50">
                      Nombre manuscrito, digitalizado
                    </p>
                  </div>

                  <div>
                    <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                      ESCANEO
                    </p>
                    <p className="mt-1 polaria-text-caption text-polaria-w">
                      {escaneoAt ? formatDateTime(escaneoAt) : "—"}
                    </p>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <p className="polaria-text-caption text-polaria-w-50">
                  Impresa{" "}
                  {impresaAt ? formatDateTime(impresaAt) : "—"}
                </p>
                <p className="inline-flex items-center gap-1.5 polaria-text-caption font-semibold text-polaria-danger">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-polaria-danger"
                    aria-hidden
                  />
                  Sin escanear {formatElapsedSince(impresaAt, now)}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
