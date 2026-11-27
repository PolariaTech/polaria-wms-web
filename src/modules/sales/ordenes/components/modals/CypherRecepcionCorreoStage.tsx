"use client";

import { useState } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import {
  isCuerpoMensajeFormato,
  looksLikeAsciiTableRow,
} from "../../utils/origen/texto-origen-pedido";
import type { CorreoChrome } from "../../utils/origen/correo-chrome";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { nombreTraeOc } from "../../utils/origen/oc-en-nombre-de-archivo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OvDelMismoCorreo } from "../../../shared/services/ovs-del-mismo-correo";
import { OrigenPedidoBodyView } from "../shared/OrigenPedidoBodyView";
import { CypherCorreoPartidoAviso } from "./CypherCorreoPartidoAviso";
import { CypherMoverAdjuntosPanel } from "./CypherMoverAdjuntosPanel";
import { CypherOrigenAdjuntosBlock } from "./CypherOrigenAdjuntosBlock";
import { CypherStageAccordion } from "./CypherStageAccordion";
import type { CypherStageId } from "./cypher-stages";
import { MetaRow } from "./CypherStageMeta";
import { useOvsDelMismoCorreo } from "./use-ovs-del-mismo-correo";

/** REQ-343: cuerpo con columnas dataTable o bloques [[tabla]] → vista con tabla HTML. */
function cuerpoSeVeComoTabla(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (isCuerpoMensajeFormato(text)) return true;
  return text.split(/\r?\n/).some((line) => looksLikeAsciiTableRow(line));
}

/** REQ-347: hermanas mínimas desde la anotación del listado (códigos). */
export function hermanasDesdeListadoPartido(input: {
  idOrdenVenta: string;
  codigoOv: string;
  ordenCompra: string | null | undefined;
  correoPartido?: boolean;
  correoPartidoDe?: readonly string[];
}): OvDelMismoCorreo[] {
  const otras = input.correoPartidoDe ?? [];
  if (!input.correoPartido || otras.length === 0) return [];
  return [
    {
      idOrdenVenta: input.idOrdenVenta,
      codigo: input.codigoOv,
      ordenCompra: input.ordenCompra?.trim() || null,
    },
    ...otras.map((codigo) => ({
      idOrdenVenta: `listado-${codigo}`,
      codigo,
      ordenCompra: null as string | null,
    })),
  ];
}

export interface CypherRecepcionCorreoStageProps {
  openStages: ReadonlySet<CypherStageId>;
  toggleAccordionStage: (stageId: CypherStageId) => void;
  correoChrome: CorreoChrome & { from?: string; to?: string; subject?: string; body?: string };
  origenNombres: string[];
  recibida: string;
  cuerpoCompleto: string;
  cuerpoMensaje: string;
  origenAdjuntosStored: OrigenAdjunto[];
  emlInnerAdjuntos: OrigenAdjunto[];
  emlInnerLoading: boolean;
  origenAdjuntos: OrigenAdjunto[];
  orden: OrdenVentaDetalleRow;
  codigoCuenta: string;
  /** Código OV del listado (venta) para fallback del aviso partido. */
  codigoOvListado?: string | null;
  correoPartido?: boolean;
  correoPartidoDe?: readonly string[];
}

export function CypherRecepcionCorreoStage({
  openStages,
  toggleAccordionStage,
  correoChrome,
  origenNombres,
  recibida,
  cuerpoCompleto,
  cuerpoMensaje,
  origenAdjuntosStored,
  emlInnerAdjuntos,
  emlInnerLoading,
  origenAdjuntos,
  orden,
  codigoCuenta,
  codigoOvListado,
  correoPartido,
  correoPartidoDe,
}: CypherRecepcionCorreoStageProps) {
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);
  const ovCreada = formatDateTime(orden.created_at || orden.fecha_pedido, zonaHoraria);
  const fallbackHermanas = hermanasDesdeListadoPartido({
    idOrdenVenta: orden.id_orden_venta,
    codigoOv: (codigoOvListado?.trim() || orden.codigo || "").trim() || orden.id_orden_venta,
    ordenCompra: orden.orden_compra_hotel,
    correoPartido,
    correoPartidoDe,
  });
  const { hermanas } = useOvsDelMismoCorreo({
    codigoCuenta,
    idOrdenVenta: orden.id_orden_venta,
    origenArchivos: orden.origen_archivos,
    fallbackHermanas,
  });
  const partido = hermanas.length >= 2;
  const [movidosPorOv, setMovidosPorOv] = useState<Record<string, readonly string[]>>({});
  const movidosEstaOv = new Set(movidosPorOv[orden.id_orden_venta] ?? []);
  const adjuntosVisibles = origenAdjuntos.filter((a) => !a.path || !movidosEstaOv.has(a.path.trim()));
  const storedVisibles = origenAdjuntosStored.filter((a) => !a.path || !movidosEstaOv.has(a.path.trim()));
  const puedeReasignar =
    partido && (orden.estado ?? "").toLowerCase() === "por_confirmar" && storedVisibles.length > 0;

  return (
    <CypherStageAccordion
      stageId="correo"
      num="00"
      title="Recepción del correo"
      open={openStages.has("correo")}
      onToggle={toggleAccordionStage}
    >
      <div className="grid grid-cols-1 gap-y-2.5 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3 @sm/cypher:grid-cols-[6rem_minmax(0,1fr)] @sm/cypher:gap-x-3.5 @sm/cypher:gap-y-2 @sm/cypher:px-4 @sm/cypher:py-3.5">
        <MetaRow label="REMITENTE">{correoChrome.from || "—"}</MetaRow>
        <MetaRow label="CORREO RECIBIDO">{recibida}</MetaRow>
        <MetaRow label="OV CREADA">{ovCreada}</MetaRow>
        <MetaRow label="ASUNTO">
          <span className="font-semibold">
            {correoChrome.subject ||
              (origenNombres.length > 0 ? `Pedido · ${origenNombres[0]}` : "—")}
          </span>
        </MetaRow>
      </div>
      {cuerpoCompleto || cuerpoMensaje ? (
        <div
          className={cn(
            "mt-2.5 max-h-56 overflow-x-hidden overflow-y-auto rounded-xl border border-polaria-w-08 bg-polaria-bg/60 px-4 py-4",
            "overscroll-contain [scrollbar-gutter:stable]",
          )}
          tabIndex={0}
          aria-label="Cuerpo del correo"
        >
          {cuerpoSeVeComoTabla(cuerpoCompleto) ? (
            <OrigenPedidoBodyView text={cuerpoCompleto} className="mt-0" />
          ) : cuerpoSeVeComoTabla(cuerpoMensaje) ? (
            <OrigenPedidoBodyView text={cuerpoMensaje} className="mt-0" />
          ) : (
            <pre
              className={cn(
                "m-0 max-w-full whitespace-pre-wrap break-words",
                "border-l-2 border-polaria-teal pl-3 font-mono text-[12.5px] leading-relaxed text-polaria-w-50",
              )}
            >
              {cuerpoMensaje || correoChrome.body || cuerpoCompleto}
            </pre>
          )}
        </div>
      ) : (
        <p className="mt-2.5 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
          Sin cuerpo de mensaje registrado.
        </p>
      )}
      <CypherCorreoPartidoAviso
        hermanas={hermanas}
        idOrdenVenta={orden.id_orden_venta}
        ordenCompra={orden.orden_compra_hotel}
      />
      {origenAdjuntosStored.length > 0 || emlInnerAdjuntos.length > 0 || emlInnerLoading ? (
        <div className="mt-4">
          <p className="polaria-text-caption font-bold tracking-[0.14em] text-polaria-w-20">
            ADJUNTOS
          </p>
          <div className="mt-2">
            {emlInnerLoading && emlInnerAdjuntos.length === 0 ? (
              <p className="polaria-text-caption text-polaria-w-50">Leyendo adjuntos del correo…</p>
            ) : null}
            <CypherOrigenAdjuntosBlock
              adjuntos={adjuntosVisibles}
              esDeEstaOv={
                partido
                  ? (adjunto) => nombreTraeOc(adjunto.nombre, orden.orden_compra_hotel)
                  : undefined
              }
            />
            {puedeReasignar ? (
              <CypherMoverAdjuntosPanel
                idOrdenVenta={orden.id_orden_venta}
                adjuntos={storedVisibles}
                hermanas={hermanas}
                onAdjuntoMovido={(path) =>
                  setMovidosPorOv((prev) => ({
                    ...prev,
                    [orden.id_orden_venta]: [...(prev[orden.id_orden_venta] ?? []), path],
                  }))
                }
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </CypherStageAccordion>
  );
}
