import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import { buildOrdenTareaAlmacenLandscapePdfMulti } from "./render-orden-tarea-almacen-landscape-pdf";
import { buildOrdenTareaAlmacenPdf } from "./render-orden-tarea-almacen-pdf";

/**
 * REQ-186: el PDF viaja en base64 dentro del JSON a /api/ventas/imprimir-orden y
 * Vercel responde 413 con cuerpos de más de ~4,5 MB. Sin `compress: true` una OV de
 * 18 hojas pesaba ~6 MB en base64.
 */
const LIMITE_BASE64_BYTES = 1024 * 1024;

async function buildSheet(
  index: number,
  total: number,
): Promise<OrdenTareaAlmacenPrintData> {
  const qrDataUrl = await QRCode.toDataURL(
    `https://app.example/captura-orden/ov-1?ot=pedido-${index}|almacen-${index}`,
    { errorCorrectionLevel: "M", margin: 1, width: 256 },
  );
  return {
    idOrdenVenta: "ov-1",
    idOrdenTrabajo: `pedido-${index}|almacen-${index}`,
    tareaIndex: index,
    tareaTotal: total,
    folio: "OV-001",
    creada: "28/10/2026 10:00",
    impresa: "28/10/2026 15:00",
    cliente: "Cliente de prueba",
    centroConsumo: "Sucursal Centro",
    numeroOrdenCliente: "PO-123",
    ordenTrabajo: `${index}/${total}`,
    fechaEntrega: "29/10/2026",
    horaEntrega: "08:00-10:00",
    direccionEntrega: "Calle 1, Centro",
    notasGenerales: "Entregar por muelle 2.",
    lineas: Array.from({ length: 49 }, (_, k) => ({
      producto: `Producto de prueba ${k + 1}`,
      especificacion: "Caja 12 pzas",
      cantidadSolicitada: `${k + 1} cajas`,
    })),
    qrDataUrl,
  };
}

function base64Bytes(pdf: { output: (type: "arraybuffer") => ArrayBuffer }) {
  return Math.ceil((pdf.output("arraybuffer").byteLength * 4) / 3);
}

describe("tamaño del PDF de impresión (REQ-186)", () => {
  it("una OV de 18 hojas en base64 queda bajo el límite de Vercel", async () => {
    const sheets = await Promise.all(
      Array.from({ length: 18 }, (_, i) => buildSheet(i + 1, 18)),
    );
    const pdf = buildOrdenTareaAlmacenLandscapePdfMulti(sheets);
    expect(base64Bytes(pdf)).toBeLessThan(LIMITE_BASE64_BYTES);
  });

  it("el PDF vertical de una hoja sale comprimido", async () => {
    const pdf = buildOrdenTareaAlmacenPdf(await buildSheet(1, 1));
    expect(base64Bytes(pdf)).toBeLessThan(LIMITE_BASE64_BYTES / 4);
  });
});
