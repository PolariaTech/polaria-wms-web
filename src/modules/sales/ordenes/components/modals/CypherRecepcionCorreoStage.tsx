"use client";

import { cn } from "@/lib/utils/cn";
import { isCuerpoMensajeFormato } from "../../utils/origen/texto-origen-pedido";
import type { CorreoChrome } from "../../utils/origen/correo-chrome";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { OrigenPedidoBodyView } from "../shared/OrigenPedidoBodyView";
import { CypherOrigenAdjuntosBlock } from "./CypherOrigenAdjuntosBlock";
import { CypherStageAccordion } from "./CypherStageAccordion";
import type { CypherStageId } from "./cypher-stages";
import { MetaRow } from "./CypherStageMeta";

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
}: CypherRecepcionCorreoStageProps) {
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
        <MetaRow label="LLEGADA">{recibida}</MetaRow>
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
          {isCuerpoMensajeFormato(cuerpoCompleto) ? (
            <OrigenPedidoBodyView text={cuerpoCompleto} className="mt-0" />
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
      {origenAdjuntosStored.length > 0 || emlInnerAdjuntos.length > 0 || emlInnerLoading ? (
        <div className="mt-4">
          <p className="polaria-text-caption font-bold tracking-[0.14em] text-polaria-w-20">
            ADJUNTOS
          </p>
          <div className="mt-2">
            {emlInnerLoading && emlInnerAdjuntos.length === 0 ? (
              <p className="polaria-text-caption text-polaria-w-50">Leyendo adjuntos del correo…</p>
            ) : null}
            <CypherOrigenAdjuntosBlock adjuntos={origenAdjuntos} />
          </div>
        </div>
      ) : null}
    </CypherStageAccordion>
  );
}
