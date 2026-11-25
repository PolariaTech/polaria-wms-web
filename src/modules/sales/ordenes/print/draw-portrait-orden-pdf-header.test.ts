import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { portraitDrawOrdenHeader } from "./draw-portrait-orden-pdf-header";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const base: OrdenTareaAlmacenPrintData = {
  idOrdenVenta: "ov",
  idOrdenTrabajo: "ot",
  folio: "OV-1",
  creada: "06/11/2026",
  impresa: "06/11/2026",
  cliente: "Cliente",
  centroConsumo: "Bar",
  numeroOrdenCliente: "PO",
  ordenTrabajo: "1/1",
  fechaEntrega: "07/11/2026",
  horaEntrega: "10:00",
  direccionEntrega: "Calle 1",
  notasGenerales: "Nota",
  lineas: [],
  qrDataUrl: null,
};

describe("portraitDrawOrdenHeader", () => {
  it("retorna Y después del encabezado", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const y = portraitDrawOrdenHeader(doc, base, 14);
    expect(y).toBeGreaterThan(14);
  });
});