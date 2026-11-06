import { describe, expect, it } from "vitest";
import {
  resolveCuerpoMensajeCompleto,
  resolveCuerpoMensajePreview,
} from "./cypher-drawer-message";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

function baseOrden(over: Partial<OrdenVentaDetalleRow> = {}): OrdenVentaDetalleRow {
  return {
    id_orden_venta: "ov-1",
    estado: "por_confirmar",
    ...over,
  } as OrdenVentaDetalleRow;
}

describe("cypher-drawer-message", () => {
  it("prioriza origen_texto para cuerpo completo", () => {
    const orden = baseOrden({ origen_texto: "  hola correo  " });
    expect(resolveCuerpoMensajeCompleto(orden)).toBe("hola correo");
  });

  it("usa observaciones largas como fallback del cuerpo", () => {
    const longObs = "x".repeat(200);
    const orden = baseOrden({ observaciones: longObs });
    expect(resolveCuerpoMensajeCompleto(orden)).toBe(longObs);
  });

  it("preview devuelve texto cuando hay cuerpo completo", () => {
    const orden = baseOrden({ origen_texto: "Linea1\nLinea2" });
    expect(resolveCuerpoMensajeCompleto(orden).length).toBeGreaterThan(0);
    expect(resolveCuerpoMensajePreview(orden).length).toBeGreaterThan(0);
  });
});
