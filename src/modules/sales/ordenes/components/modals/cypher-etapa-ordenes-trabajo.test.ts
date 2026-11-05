import { describe, expect, it } from "vitest";
import { CYPHER_ETAPA_ORDENES_TRABAJO_LABEL } from "./cypher-etapa-ordenes-trabajo";

describe("CYPHER_ETAPA_ORDENES_TRABAJO_LABEL (REQ-214)", () => {
  it("unifica el nombre de la etapa 02", () => {
    expect(CYPHER_ETAPA_ORDENES_TRABAJO_LABEL).toBe("Órdenes de tarea");
  });
});
