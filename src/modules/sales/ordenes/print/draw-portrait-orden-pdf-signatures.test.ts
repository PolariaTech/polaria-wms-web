import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { portraitDrawSignaturesAndIncidencias } from "./draw-portrait-orden-pdf-signatures";
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
  lineas: [],
  qrDataUrl: null,
};

describe("portraitDrawSignaturesAndIncidencias", () => {
  it("dibuja bloque de firmas sin error", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    expect(() =>
      portraitDrawSignaturesAndIncidencias(doc, base, 200),
    ).not.toThrow();
  });
});