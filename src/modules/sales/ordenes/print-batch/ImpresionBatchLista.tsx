"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import {
  formatEstadoOrdenVenta,
  variantEstadoOrdenVenta,
} from "../../shared/constants/sales-status";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import {
  diaEntregaDeOv,
  estadoSeleccionOv,
  etiquetaDiaEntrega,
  totalOtDeOv,
  type SeleccionBatch,
} from "./batch-seleccion";

const CHECK_CLASS =
  "h-4 w-4 cursor-pointer accent-[var(--color-polaria-teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

type CentrosOv =
  | { estado: "cargando" }
  | { estado: "error" }
  | { estado: "listo"; centros: Readonly<Record<number, string>> };

function CasillaOv({
  estado,
  etiqueta,
  onChange,
}: {
  estado: "ninguna" | "parcial" | "todas";
  etiqueta: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = estado === "parcial";
  }, [estado]);
  return (
    // El área tocable llega a 44 px sin agrandar la casilla.
    <label className="-m-3 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={estado === "todas"}
        onChange={onChange}
        aria-label={etiqueta}
        className={CHECK_CLASS}
      />
    </label>
  );
}

function textoCentro(centros: CentrosOv | undefined, ot: number): string {
  if (!centros || centros.estado === "cargando") return "Cargando…";
  if (centros.estado === "error") return "No se pudo leer";
  return centros.centros[ot] ?? "Sin centro de consumo";
}

interface ImpresionBatchListaProps {
  rows: readonly OrdenVentaOperadorRow[];
  seleccion: SeleccionBatch;
  onAlternarOv: (row: OrdenVentaOperadorRow) => void;
  onAlternarOt: (row: OrdenVentaOperadorRow, ot: number) => void;
  /** Centro de consumo de cada OT, para que el operador reconozca cuál marca. */
  cargarCentros: (row: OrdenVentaOperadorRow) => Promise<Record<number, string>>;
  /** Ids de las OV con una impresión en su registro (REQ-298); `null` o ausente = aún no se sabe y no se marca nada. */
  yaImpresas?: ReadonlySet<string> | null;
}

/** Las OV llegan ordenadas por entrega; cada día lleva su encabezado. */
export function ImpresionBatchLista({
  rows,
  seleccion,
  onAlternarOv,
  onAlternarOt,
  cargarCentros,
  yaImpresas,
}: ImpresionBatchListaProps) {
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(new Set());
  const [centros, setCentros] = useState<Readonly<Record<string, CentrosOv>>>({});

  const alternarAbierta = (row: OrdenVentaOperadorRow) => {
    const id = row.idOrdenVenta;
    setAbiertas((previas) => {
      const siguientes = new Set(previas);
      if (siguientes.has(id)) siguientes.delete(id);
      else siguientes.add(id);
      return siguientes;
    });
    if (centros[id]) return;
    setCentros((previos) => ({ ...previos, [id]: { estado: "cargando" } }));
    cargarCentros(row).then(
      (datos) => setCentros((previos) => ({ ...previos, [id]: { estado: "listo", centros: datos } })),
      () => setCentros((previos) => ({ ...previos, [id]: { estado: "error" } })),
    );
  };

  let diaAnterior: string | null = null;
  return (
    <ul>
      {rows.map((row) => {
        const dia = diaEntregaDeOv(row);
        const encabezado = dia !== diaAnterior;
        diaAnterior = dia;
        const total = totalOtDeOv(row);
        const estado = estadoSeleccionOv(seleccion, row);
        const elegidas = seleccion.get(row.idOrdenVenta);
        const abierta = abiertas.has(row.idOrdenVenta);
        const oc = row.occ && row.occ !== "—" ? row.occ : "";
        return (
          <Fragment key={row.idOrdenVenta}>
            {encabezado ? (
              <li
                aria-hidden
                className="sticky top-0 z-[1] border-b border-polaria-w-08 bg-polaria-bg px-4 py-2 [@media(max-height:50rem)]:py-1 text-sm font-semibold text-polaria-w"
              >
                {etiquetaDiaEntrega(dia)}
              </li>
            ) : null}
            <li
              className={cn(
                "border-b border-polaria-w-08 px-4 py-3 [@media(max-height:50rem)]:py-2 transition-colors motion-reduce:transition-none",
                estado !== "ninguna" && "bg-polaria-t-20",
              )}
            >
              <div className="flex items-center gap-4">
                <CasillaOv
                  estado={estado}
                  etiqueta={`Seleccionar ${row.venta}, ${row.comprador}`}
                  onChange={() => onAlternarOv(row)}
                />
                <div
                  onClick={() => onAlternarOv(row)}
                  className="grid min-w-0 flex-1 cursor-pointer gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="font-semibold tabular-nums text-polaria-w">{row.venta}</span>
                  <span className="truncate text-polaria-w" title={row.comprador}>
                    {row.comprador}
                  </span>
                  <span className="polaria-text-body-sm tabular-nums text-polaria-w">
                    {oc ? `OC ${oc}` : ""}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    {yaImpresas?.has(row.idOrdenVenta) ? (
                      <PolariaTableBadge variant="positive">Impresa</PolariaTableBadge>
                    ) : null}
                    <PolariaTableBadge variant={variantEstadoOrdenVenta(row.estado)}>
                      {formatEstadoOrdenVenta(row.estado)}
                    </PolariaTableBadge>
                  </span>
                </div>
                {total > 1 ? (
                  <button
                    type="button"
                    aria-expanded={abierta}
                    aria-controls={`ots-${row.idOrdenVenta}`}
                    onClick={() => alternarAbierta(row)}
                    className="polaria-text-body-sm inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-polaria-w transition hover:bg-polaria-w-08 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal motion-reduce:transition-none"
                  >
                    <span className="tabular-nums">
                      {elegidas?.size ? `${elegidas.size} de ${total}` : total} OT
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none",
                        abierta && "rotate-180",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </button>
                ) : (
                  <span className="polaria-text-body-sm shrink-0 px-2 text-polaria-w">1 OT</span>
                )}
              </div>

              {total > 1 ? (
                <ul
                  id={`ots-${row.idOrdenVenta}`}
                  hidden={!abierta}
                  aria-label={`Órdenes de trabajo de ${row.venta}`}
                  className="mt-2 flex flex-wrap gap-2 pl-8"
                >
                  {Array.from({ length: total }, (_, i) => i + 1).map((ot) => {
                    const marcada = elegidas?.has(ot) ?? false;
                    return (
                      <li key={ot}>
                        <label
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-1.5 transition motion-reduce:transition-none",
                            marcada
                              ? "border-polaria-teal bg-polaria-t-20 text-polaria-w"
                              : "border-polaria-w-20 text-polaria-w hover:border-polaria-t-20",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={marcada}
                            onChange={() => onAlternarOt(row, ot)}
                            className={CHECK_CLASS}
                          />
                          <span className="flex flex-col text-left leading-tight">
                            <span className="text-sm font-semibold tabular-nums">
                              OT {ot} <span className="font-normal">de {total}</span>
                            </span>
                            <span className="text-xs text-polaria-w">
                              {textoCentro(centros[row.idOrdenVenta], ot)}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
