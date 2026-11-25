"use client";

import { useAuthStore } from "@/stores/auth.store";
import { normalizeEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { ConsolidadoPrefactura } from "./ConsolidadoPrefactura";
import { CypherStageAccordion } from "./CypherStageAccordion";
import type { CypherStageId } from "./cypher-stages";

function codigoEmpresaDeSesion(): string {
  const estado = useAuthStore.getState();
  return (estado.session?.codigoEmpresa ?? estado.context?.codigoEmpresa ?? "").trim();
}

function VistaPrefactura({ orden }: { orden: OrdenVentaDetalleRow }) {
  if (normalizeEstadoOrdenVenta(orden.estado) === "por_confirmar") {
    return (
      <p className="polaria-text-body-sm text-polaria-w-50">
        La prefactura se muestra desde Confirmada.
      </p>
    );
  }
  const codigo = codigoEmpresaDeSesion();
  if (!codigo) {
    return <p className="polaria-text-body-sm text-polaria-w">No se encontró la empresa de la sesión.</p>;
  }
  return <ConsolidadoPrefactura orden={orden} codigoEmpresa={codigo} />;
}

export function CypherPrefacturaStage({
  openStages,
  toggleAccordionStage,
  orden,
}: {
  openStages: ReadonlySet<CypherStageId>;
  toggleAccordionStage: (stageId: CypherStageId) => void;
  orden: OrdenVentaDetalleRow;
}) {
  const abierta = openStages.has("prefactura");
  return (
    <CypherStageAccordion
      stageId="prefactura"
      num="04"
      title="Prefactura"
      open={abierta}
      onToggle={toggleAccordionStage}
    >
      {abierta ? <VistaPrefactura orden={orden} /> : null}
    </CypherStageAccordion>
  );
}
