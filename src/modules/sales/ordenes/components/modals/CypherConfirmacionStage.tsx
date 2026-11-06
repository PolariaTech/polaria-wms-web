"use client";

import { formatDateTime } from "@/components/shared/utils/formatters";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { stageReached } from "./cypher-stages";
import type { EstadoOrdenVenta, OrdenVentaDetalleRow, OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import {
  formatOrdenVentaLineaTotal,
  formatOrdenVentaTotal,
  resolveOrdenVentaLineaTitulo,
  sumOrdenVentaCantidadKg,
} from "../../utils/display/orden-venta-display";
import { OrdenTrabajoChipSelector } from "../orden-trabajo/OrdenTrabajoChipSelector";
import { CypherReagruparOtButton } from "./CypherReagruparOtButton";
import { CypherStageAccordion } from "./CypherStageAccordion";
import { CYPHER_ETAPA_ORDENES_TRABAJO_LABEL } from "./cypher-etapa-ordenes-trabajo";
import type { CypherStageId } from "./cypher-stages";
import { PendingStageBody } from "./CypherStageMeta";
import type { CypherCompanionOtPicker } from "./cypher-companion-ot.types";

export interface CypherConfirmacionStageProps {
  openStages: ReadonlySet<CypherStageId>;
  toggleAccordionStage: (stageId: CypherStageId) => void;
  orden: OrdenVentaDetalleRow;
  activeOtPicker: CypherCompanionOtPicker | null;
  estado: EstadoOrdenVenta;
  comprador: string;
  occ: string;
  zonaHoraria: string;
  lineas: OrdenVentaLineaRow[];
}

export function CypherConfirmacionStage({
  openStages,
  toggleAccordionStage,
  orden,
  activeOtPicker,
  estado,
  comprador,
  occ,
  zonaHoraria,
  lineas,
}: CypherConfirmacionStageProps) {
  return (
    <CypherStageAccordion
      stageId="confirmacion"
      num="02"
      title={CYPHER_ETAPA_ORDENES_TRABAJO_LABEL}
      open={openStages.has("confirmacion")}
      muted={!(activeOtPicker && activeOtPicker.hijas.length > 0) && !stageReached(estado, "confirmacion")}
      onToggle={toggleAccordionStage}
      headerAction={
        activeOtPicker && activeOtPicker.hijas.length > 0 ? (
          <CypherReagruparOtButton onClick={activeOtPicker.onReagrupar} />
        ) : undefined
      }
    >
      {activeOtPicker && activeOtPicker.hijas.length > 0 ? (
        <>
          <p className="polaria-text-body-sm text-polaria-w-50">
            {activeOtPicker.hijas.length === 1 ? (
              <>
                Esta venta tiene{" "}
                <span className="font-semibold text-polaria-teal">1 orden de trabajo</span>.
              </>
            ) : (
              <>
                Esta venta tiene{" "}
                <span className="font-semibold text-polaria-teal">
                  {activeOtPicker.hijas.length} órdenes de trabajo
                </span>
                . Elige cuál quieres revisar para continuar.
              </>
            )}
          </p>
          <OrdenTrabajoChipSelector
            className="mt-4"
            items={activeOtPicker.hijas.map((hija) => ({
              id: hija.id,
              label: hija.label,
            }))}
            selectedId={activeOtPicker.selectedId}
            onSelect={activeOtPicker.onSelect}
          />
        </>
      ) : stageReached(estado, "confirmacion") ? (
        <>
          <div className="grid grid-cols-1 gap-3 @md/cypher:grid-cols-3">
            <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
              <p className="polaria-text-caption text-polaria-w-20">Cliente</p>
              <p className="mt-1 polaria-text-body-sm font-medium text-polaria-w">{comprador}</p>
            </div>
            <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
              <p className="polaria-text-caption text-polaria-w-20">OCC</p>
              <p className="mt-1 polaria-text-body-sm font-medium text-polaria-w">{occ}</p>
            </div>
            <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
              <p className="polaria-text-caption text-polaria-w-20">Entrega</p>
              <p className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
                {orden.fecha_entrega?.trim()
                  ? formatDateTime(orden.fecha_entrega, zonaHoraria)
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-polaria-w-08">
            {lineas.length === 0 ? (
              <p className="px-4 py-3 polaria-text-body-sm text-polaria-w-50">Sin líneas registradas.</p>
            ) : (
              <>
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-polaria-w-08">
                    <tr className="border-b border-polaria-t-20">
                      <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                        Producto
                      </th>
                      <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                        Cantidad
                      </th>
                      <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                        Importe
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((linea) => (
                      <tr
                        key={linea.id_linea_orden_venta}
                        className="border-b border-polaria-w-08 last:border-b-0"
                      >
                        <td className="px-3 py-2.5">
                          <p className="polaria-text-body-sm font-medium text-polaria-w">
                            {resolveOrdenVentaLineaTitulo(linea)}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right polaria-text-body-sm text-polaria-w">
                          {formatKgEs(linea.cantidad_pedida)} kg
                        </td>
                        <td className="px-3 py-2.5 text-right polaria-text-body-sm font-medium text-polaria-teal">
                          ${formatPrecioEs(formatOrdenVentaLineaTotal(linea))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-polaria-t-20 bg-polaria-w-08 px-3 py-2">
                  <p className="polaria-text-caption text-polaria-w-50">
                    {lineas.length} producto{lineas.length === 1 ? "" : "s"} ·{" "}
                    {formatKgEs(sumOrdenVentaCantidadKg(orden))} kg
                  </p>
                  <p className="polaria-text-body-sm text-polaria-w-50">
                    Total:{" "}
                    <span className="font-semibold text-polaria-teal">{formatOrdenVentaTotal(orden)}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <PendingStageBody />
      )}
    </CypherStageAccordion>
  );
}
