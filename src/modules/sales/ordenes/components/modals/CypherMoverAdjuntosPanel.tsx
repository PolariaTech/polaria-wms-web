"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import type { OvDelMismoCorreo } from "../../../shared/services/ovs-del-mismo-correo";
import { moverAdjuntoOrdenVenta } from "../../services/mover-adjunto-ov.client";

interface CypherMoverAdjuntosPanelProps {
  idOrdenVenta: string;
  adjuntos: readonly OrigenAdjunto[];
  hermanas: readonly OvDelMismoCorreo[];
  onAdjuntoMovido: (path: string) => void;
}

function etiquetaHermana(hermana: OvDelMismoCorreo): string {
  const oc = hermana.ordenCompra?.trim();
  return oc ? `${hermana.codigo} · OC ${oc}` : hermana.codigo;
}

/**
 * REQ-361: permite mover un adjunto del correo desde esta OV hacia otra OV hermana del mismo envío
 * cuando la división automática dejó el archivo en la orden equivocada.
 */
export function CypherMoverAdjuntosPanel({
  idOrdenVenta,
  adjuntos,
  hermanas,
  onAdjuntoMovido,
}: CypherMoverAdjuntosPanelProps) {
  const destinos = hermanas.filter(
    (h) => h.idOrdenVenta !== idOrdenVenta && !h.idOrdenVenta.startsWith("listado-"),
  );
  const movibles = adjuntos.filter((a) => Boolean(a.path?.trim()));

  const [destinoPorPath, setDestinoPorPath] = useState<Record<string, string>>({});
  const [moviendoPath, setMoviendoPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (destinos.length === 0 || movibles.length === 0) return null;

  async function manejarMover(adjunto: OrigenAdjunto): Promise<void> {
    const path = adjunto.path?.trim();
    if (!path) return;
    const idDestino = destinoPorPath[path] || destinos[0]!.idOrdenVenta;
    const destino = destinos.find((d) => d.idOrdenVenta === idDestino);
    setMoviendoPath(path);
    setError(null);
    setAviso(null);
    try {
      await moverAdjuntoOrdenVenta({ idOrdenVenta, idOrdenVentaDestino: idDestino, path });
      onAdjuntoMovido(path);
      setAviso(`${adjunto.nombre} movido a ${destino?.codigo ?? "la OV destino"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo mover el adjunto.");
    } finally {
      setMoviendoPath(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <ArrowRightLeft className="h-3.5 w-3.5 text-polaria-teal" strokeWidth={1.75} aria-hidden />
        <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-teal">
          REASIGNAR ARCHIVO A OTRA OV
        </p>
      </div>
      <p className="mt-1 polaria-text-caption text-polaria-w-50">
        Si un adjunto corresponde a otra orden de venta de este correo, muévelo aquí.
      </p>
      <ul className="mt-2.5 space-y-2">
        {movibles.map((adjunto) => {
          const path = adjunto.path!.trim();
          const ocupado = moviendoPath !== null;
          return (
            <li
              key={path}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-polaria-w-08 bg-polaria-bg/60 px-2.5 py-2"
            >
              <span className="min-w-0 flex-1 truncate polaria-text-caption text-polaria-w" title={adjunto.nombre}>
                {adjunto.nombre}
              </span>
              <select
                aria-label={`Destino para ${adjunto.nombre}`}
                value={destinoPorPath[path] || destinos[0]!.idOrdenVenta}
                disabled={ocupado}
                onChange={(e) =>
                  setDestinoPorPath((prev) => ({ ...prev, [path]: e.target.value }))
                }
                className="rounded-lg border border-polaria-w-08 bg-polaria-bg px-2 py-1 text-xs text-polaria-w focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal"
              >
                {destinos.map((d) => (
                  <option key={d.idOrdenVenta} value={d.idOrdenVenta}>
                    {etiquetaHermana(d)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => void manejarMover(adjunto)}
                className="rounded-lg bg-polaria-teal px-2.5 py-1 text-xs font-semibold text-polaria-on-teal hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {moviendoPath === path ? "Moviendo…" : "Mover"}
              </button>
            </li>
          );
        })}
      </ul>
      {aviso ? <p role="status" className="mt-2 polaria-text-caption text-polaria-teal">{aviso}</p> : null}
      {error ? <p role="alert" className="mt-2 polaria-text-caption text-polaria-warning">{error}</p> : null}
    </div>
  );
}
