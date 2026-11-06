import { describe, expect, it } from "vitest";
import { buildOrdenTareaAlmacenLandscapePdf } from "./render-orden-tarea-almacen-landscape-pdf";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const base: OrdenTareaAlmacenPrintData = {
  idOrdenVenta: "ov-1",
  idOrdenTrabajo: "ot-1",
  folio: "OV-1",
  creada: "06/11/2026 08:00",
  impresa: "06/11/2026 08:01",
  cliente: "Cliente",
  centroConsumo: "Bar",
  numeroOrdenCliente: "PO-1",
  ordenTrabajo: "1/1",
  fechaEntrega: "06/11/2026",
  horaEntrega: "10:00",
  direccionEntrega: "Calle 1",
  notasGenerales: "",
  lineas: Array.from({ length: 20 }, (_, i) => ({
    producto: `P${i + 1}`,
    especificacion: "spec",
    cantidadSolicitada: "1 kg",
  })),
  qrDataUrl: null,
};

describe("buildOrdenTareaAlmacenLandscapePdf (REQ-246)", () => {
  it("genera una hoja con hasta 20 filas y no falla sin QR", () => {
    const pdf = buildOrdenTareaAlmacenLandscapePdf(base);
    expect(pdf.getNumberOfPages()).toBe(1);
  });
});
