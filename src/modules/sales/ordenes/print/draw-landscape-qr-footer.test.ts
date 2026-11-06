import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import {
  drawLandscapeQrFooter,
  landscapeQrFooterReserve,
} from "./draw-landscape-qr-footer";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const data: OrdenTareaAlmacenPrintData = {
  idOrdenVenta: "ov-1",
  idOrdenTrabajo: "ot-1",
  folio: "OV-1",
  creada: "05/11/2026 20:25",
  impresa: "06/11/2026 14:21",
  cliente: "Cliente",
  centroConsumo: "Bar",
  numeroOrdenCliente: "PO-1",
  ordenTrabajo: "1/1",
  fechaEntrega: "06/11/2026",
  horaEntrega: "10:00",
  direccionEntrega: "Calle 1",
  notasGenerales: "",
  lineas: [],
  qrDataUrl: null,
  diaEntrega: "VIERNES",
};

describe("drawLandscapeQrFooter", () => {
  it("reserva altura con holgura de tabla", () => {
    expect(landscapeQrFooterReserve(26, "VIERNES")).toBeGreaterThan(26);
  });

  it("dibuja sin lanzar", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    expect(() =>
      drawLandscapeQrFooter(doc, {
        data,
        rightX: 90,
        colWidths: [6, 34, 38, 14, 11, 11],
        py: 200,
        pageBottom: 271,
        pageW: 215.9,
        margin: 8,
        qrSize: 26,
      }),
    ).not.toThrow();
  });
});
