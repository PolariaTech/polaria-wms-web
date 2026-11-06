"use client";

import { formatEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import type { EstadoOrdenVenta, OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { stageReached } from "./cypher-stages";
import { CypherAlistadoSection } from "./CypherAlistadoSection";
import { CypherAlistamientoSection } from "./CypherAlistamientoSection";
import { CypherStageAccordion } from "./CypherStageAccordion";
import type { CypherStageId } from "./cypher-stages";
import { PendingStageBody } from "./CypherStageMeta";

export interface CypherCambioEstadoPipelineStageProps {
  openStages: ReadonlySet<CypherStageId>;
  toggleAccordionStage: (stageId: CypherStageId) => void;
  orden: OrdenVentaDetalleRow;
  estado: EstadoOrdenVenta;
  hijasFromOrden: readonly OrdenTrabajoHija[];
  puedeAlmacen: boolean;
  onFotos: (idOrdenTrabajo: string) => void;
  estadosSuperiores: readonly EstadoOrdenVenta[];
  estadoCambiando: EstadoOrdenVenta | null;
  setCambioEstadoError: (value: string | null) => void;
  setEstadoPendiente: (value: EstadoOrdenVenta | null) => void;
}

export function CypherCambioEstadoPipelineStage({
  openStages,
  toggleAccordionStage,
  orden,
  estado,
  hijasFromOrden,
  puedeAlmacen,
  onFotos,
  estadosSuperiores,
  estadoCambiando,
  setCambioEstadoError,
  setEstadoPendiente,
}: CypherCambioEstadoPipelineStageProps) {
  return (
    <CypherStageAccordion
      stageId="cambio-estado"
      num="04"
      title="Cambiar estado"
      open={openStages.has("cambio-estado")}
      onToggle={toggleAccordionStage}
    >
      {estadosSuperiores.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">No hay estados posteriores.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {estadosSuperiores.map((destino) => (
            <button
              key={destino}
              type="button"
              disabled={estadoCambiando !== null}
              onClick={() => {
                if (estadoCambiando) return;
                setCambioEstadoError(null);
                setEstadoPendiente(destino);
              }}
              className="rounded-lg bg-polaria-teal px-2.5 py-1.5 text-xs font-semibold text-polaria-on-teal transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {formatEstadoOrdenVenta(destino)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-0 border-t border-polaria-w-08 pt-2">
        <CypherStageAccordion
          stageId="alistamiento"
          title="Alistamiento"
          nested
          open={openStages.has("alistamiento")}
          muted={!stageReached(estado, "alistamiento")}
          onToggle={toggleAccordionStage}
        >
          {stageReached(estado, "alistamiento") && orden ? (
            <CypherAlistamientoSection
              idOrdenVenta={orden.id_orden_venta}
              orden={orden}
              hijas={hijasFromOrden}
              onVerFotosOt={puedeAlmacen ? (idOt) => onFotos(idOt) : undefined}
            />
          ) : (
            <PendingStageBody />
          )}
        </CypherStageAccordion>

        <CypherStageAccordion
          stageId="alistado"
          title="Alistado"
          nested
          open={openStages.has("alistado")}
          muted={!stageReached(estado, "alistado")}
          onToggle={toggleAccordionStage}
        >
          {stageReached(estado, "alistado") && orden ? (
            <CypherAlistadoSection
              idOrdenVenta={orden.id_orden_venta}
              orden={orden}
              hijas={hijasFromOrden}
            />
          ) : (
            <PendingStageBody />
          )}
        </CypherStageAccordion>

        <CypherStageAccordion
          stageId="revisado"
          title="Revisado"
          nested
          open={openStages.has("revisado")}
          muted={!stageReached(estado, "revisado")}
          onToggle={toggleAccordionStage}
        >
          {stageReached(estado, "revisado") ? (
            <p className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm text-polaria-w">
              Todas las órdenes de trabajo tienen el chequeo de revisión.
            </p>
          ) : (
            <PendingStageBody />
          )}
        </CypherStageAccordion>

        <CypherStageAccordion
          stageId="despachado"
          title="Despachado"
          nested
          open={openStages.has("despachado")}
          muted={!stageReached(estado, "despachado")}
          onToggle={toggleAccordionStage}
        >
          {stageReached(estado, "despachado") ? (
            <p className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm text-polaria-w">
              La hoja tiene la firma de Despachó. La orden quedó embarcada.
            </p>
          ) : (
            <PendingStageBody />
          )}
        </CypherStageAccordion>

        <CypherStageAccordion
          stageId="facturado"
          title="Facturado"
          nested
          open={openStages.has("facturado")}
          muted={!stageReached(estado, "facturado")}
          onToggle={toggleAccordionStage}
        >
          {stageReached(estado, "facturado") ? (
            <p className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm text-polaria-w">
              La hoja tiene Documentación o Factura (OK), o el folio de la factura.
            </p>
          ) : (
            <PendingStageBody />
          )}
        </CypherStageAccordion>
      </div>
    </CypherStageAccordion>
  );
}
