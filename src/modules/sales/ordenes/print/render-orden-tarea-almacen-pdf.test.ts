import { describe, expect, it } from "vitest";
import { buildOrdenTareaAlmacenPdf } from "./render-orden-tarea-almacen-pdf";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

describe("buildOrdenTareaAlmacenPdf (REQ-246)", () => {
  it("genera PDF vertical con QR de respaldo sin dataUrl", () => {
    const data: OrdenTareaAlmacenPrintData = {
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
      lineas: [{ producto: "Aguacate", cantidadSolicitada: "2 kg" }],
      qrDataUrl: null,
      diaEntrega: "VIERNES",
    };
    expect(buildOrdenTareaAlmacenPdf(data).getNumberOfPages()).toBeGreaterThan(0);
  });
});
