import { describe, expect, it } from "vitest";
import {
  CYPHER_PIPELINE_NESTED_IDS,
  CYPHER_STAGES,
  isCypherNavStageActive,
  stageReached,
} from "./cypher-stages";

describe("CYPHER_STAGES (REQ-237 / REQ-271)", () => {
  it("barra: 00 Correo, 01 Fiscales, … 04 Cambiar estado, 05 Bitácora", () => {
    expect(CYPHER_STAGES.map((s) => `${s.num}:${s.id}`)).toEqual([
      "00:correo",
      "01:fiscales",
      "02:confirmacion",
      "03:cliente-vs-mateo",
      "04:cambio-estado",
      "05:bitacora",
    ]);
    expect(CYPHER_STAGES.find((s) => s.id === "cambio-estado")?.label).toBe(
      "Cambiar estado",
    );
  });

  it("pipeline Alistamiento→Facturado queda anidado, no en tabs", () => {
    expect([...CYPHER_PIPELINE_NESTED_IDS]).toEqual(
      expect.arrayContaining([
        "alistamiento",
        "alistado",
        "revisado",
        "despachado",
        "facturado",
      ]),
    );
    for (const id of CYPHER_PIPELINE_NESTED_IDS) {
      expect(CYPHER_STAGES.some((s) => s.id === id)).toBe(false);
    }
  });

  it("tab Cambiar estado activo al foco en sub-etapa", () => {
    expect(isCypherNavStageActive("cambio-estado", "alistamiento")).toBe(true);
    expect(isCypherNavStageActive("bitacora", "alistamiento")).toBe(false);
    expect(isCypherNavStageActive("correo", "correo")).toBe(true);
  });

  it("stageReached respeta el pipeline de estado", () => {
    expect(stageReached("confirmada", "alistamiento")).toBe(false);
    expect(stageReached("alistamiento", "alistamiento")).toBe(true);
    expect(stageReached("facturada", "facturado")).toBe(true);
  });
});
