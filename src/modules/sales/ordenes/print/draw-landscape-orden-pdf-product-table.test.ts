import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { landscapeDrawProductTable } from "./draw-landscape-orden-pdf-product-table";
import { LANDSCAPE_LEFT_W, LANDSCAPE_GAP, LANDSCAPE_MARGIN } from "./draw-landscape-orden-pdf-layout";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const base: OrdenTareaAlmacenPrintData = {
  idOrdenVenta: "ov",
  idOrdenTrabajo: "ot",
  folio: "OV-1",
  creada: "06/11/2026",
  impresa: "06/11/2026",
  cliente: "C",
  centroConsumo: "Bar",
  numeroOrdenCliente: "PO",
  ordenTrabajo: "1/1",
  fechaEntrega: "07/11/2026",
  horaEntrega: "10:00",
  direccionEntrega: "Dir",
  notasGenerales: "",
  lineas: Array.from({ length: 5 }, (_, i) => ({
    producto: `P${i}`,
    cantidadSolicitada: "1",
  })),
  qrDataUrl: null,
};

describe("landscapeDrawProductTable", () => {
  it("dibuja tabla derecha sin error", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const rightX = LANDSCAPE_MARGIN + LANDSCAPE_LEFT_W + LANDSCAPE_GAP;
    expect(() => landscapeDrawProductTable(doc, base, rightX)).not.toThrow();
  });
});