import { describe, expect, it } from "vitest";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  formatEstadoOrden,
  formatObservacionesOrden,
} from "./compras-page-content.display";

const row = (observaciones: string | null): OrdenCompraRow =>
  ({ id_orden_compra: "oc-1", observaciones }) as OrdenCompraRow;

describe("compras-page-content.display", () => {
  it("formatEstadoOrden devuelve la etiqueta del estado", () => {
    expect(formatEstadoOrden("borrador")).toBeTruthy();
    expect(formatEstadoOrden("estado-desconocido" as never)).toBe(
      "estado-desconocido",
    );
  });

  it("formatObservacionesOrden combina observación y notificación", () => {
    const notified = new Set(["oc-1"]);

    expect(formatObservacionesOrden(row("Nota"), notified)).toBe(
      "Nota — Proveedor notificado",
    );
    expect(formatObservacionesOrden(row(null), notified)).toBe(
      "Proveedor notificado",
    );
    expect(formatObservacionesOrden(row("Nota"), new Set())).toBe("Nota");
    expect(formatObservacionesOrden(row(null), new Set())).toBe("—");
  });
});
