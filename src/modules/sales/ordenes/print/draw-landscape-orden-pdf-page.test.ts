import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { drawOrdenTareaAlmacenLandscapePage } from "./draw-landscape-orden-pdf-page";
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
  direccionEntrega: "Dir",
  notasGenerales: "",
  lineas: [{ producto: "Aguacate", cantidadSolicitada: "2 kg" }],
  qrDataUrl: null,
};

describe("drawOrdenTareaAlmacenLandscapePage", () => {
  it("compone panel izquierdo y productos", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    expect(() => drawOrdenTareaAlmacenLandscapePage(doc, base)).not.toThrow();
    expect(doc.getNumberOfPages()).toBe(1);
  });
});