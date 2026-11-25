import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { portraitDrawProductTables } from "./draw-portrait-orden-pdf-product-table";
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
  lineas: [{ producto: "P1", cantidadSolicitada: "1" }],
  qrDataUrl: null,
};

describe("portraitDrawProductTables", () => {
  it("avanza Y sin lanzar con líneas vacías", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const y = portraitDrawProductTables(doc, base, 40);
    expect(y).toBeGreaterThan(40);
  });
});