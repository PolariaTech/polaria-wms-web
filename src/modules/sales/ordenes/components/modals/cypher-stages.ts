import type { EstadoOrdenVenta } from "../../../shared/types/sales.types";
import { CYPHER_ETAPA_ORDENES_TRABAJO_LABEL } from "./cypher-etapa-ordenes-trabajo";

export type CypherStageId =
  | "fiscales"
  | "correo"
  | "confirmacion"
  | "cliente-vs-mateo"
  | "alistamiento"
  | "alistado"
  | "revisado"
  | "facturado"
  | "despachado"
  | "bitacora"
  | "cambio-estado";

/**
 * Tabs de la barra Cypher.
 * REQ-271: Correo primero (validación de origen).
 * REQ-237: pipeline vive dentro de Cambiar estado.
 */
export const CYPHER_STAGES: ReadonlyArray<{
  id: CypherStageId;
  num: string;
  label: string;
  title: string;
}> = [
  { id: "correo", num: "00", label: "Correo", title: "Recepción del correo" },
  {
    id: "fiscales",
    num: "01",
    label: "Fiscales",
    title: "Datos fiscales — referencia",
  },
  {
    id: "confirmacion",
    num: "02",
    label: CYPHER_ETAPA_ORDENES_TRABAJO_LABEL,
    title: CYPHER_ETAPA_ORDENES_TRABAJO_LABEL,
  },
  {
    id: "cliente-vs-mateo",
    num: "03",
    label: "Correo vs Mateo IA vs usuario",
    title: "Correo vs Mateo IA vs usuario",
  },
  {
    id: "cambio-estado",
    num: "04",
    label: "Cambiar estado",
    title: "Cambiar estado",
  },
  {
    id: "bitacora",
    num: "05",
    label: "Bitácora",
    title: "Bitácora de eventos",
  },
];

/** Sub-etapas del pipeline anidadas bajo «Cambiar estado» (no van en la barra). */
export const CYPHER_PIPELINE_NESTED_IDS = new Set<CypherStageId>([
  "alistamiento",
  "alistado",
  "revisado",
  "despachado",
  "facturado",
]);

export function isCypherNavStageActive(
  stageId: CypherStageId,
  activeStage: CypherStageId,
): boolean {
  if (activeStage === stageId) return true;
  return (
    stageId === "cambio-estado" && CYPHER_PIPELINE_NESTED_IDS.has(activeStage)
  );
}

const ESTADO_STAGE_INDEX: Record<EstadoOrdenVenta, number> = {
  por_confirmar: 0,
  confirmada: 1,
  alistamiento: 2,
  alistada: 3,
  revisada: 4,
  despachada: 5,
  facturada: 6,
  cancelada: 0,
};

export function stageReached(
  estado: EstadoOrdenVenta,
  stage: CypherStageId,
): boolean {
  const current = ESTADO_STAGE_INDEX[estado] ?? 0;
  if (stage === "fiscales") return true;
  if (stage === "correo") return true;
  if (stage === "confirmacion") return current >= 1;
  if (stage === "cliente-vs-mateo") return true;
  if (stage === "alistamiento") return current >= 2;
  if (stage === "alistado") return current >= 3;
  if (stage === "revisado") return current >= 4;
  if (stage === "despachado") return current >= 5;
  if (stage === "facturado") return current >= 6;
  return true; // bitácora y cambiar estado siempre
}
