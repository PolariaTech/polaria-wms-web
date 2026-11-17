import { describe, expect, it } from "vitest";
import { leerCfdiParaVista } from "./xml-cfdi";

const CFDI =
  '<?xml version="1.0"?>' +
  '<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Folio="981" ' +
  'Fecha="2026-11-17T08:51:54" TipoDeComprobante="E" Moneda="MXN" SubTotal="1460.00" Total="1693.60">' +
  '<cfdi:Emisor Rfc="AAP010101AAA" Nombre="AGUACATES DE PUEBLA"/>' +
  '<cfdi:Receptor Rfc="HIL010101BBB" Nombre="Adolfo Rueda"/>' +
  '<cfdi:Conceptos>' +
  '<cfdi:Concepto Descripcion="FRAMBUESAS" Cantidad="5.000000" Importe="1460.00"/>' +
  "</cfdi:Conceptos></cfdi:Comprobante>";

describe("leerCfdiParaVista", () => {
  it("saca folio, partes y totales de un CFDI de nota de crédito", () => {
    expect(leerCfdiParaVista(CFDI)).toEqual({
      tipo: "Nota de crédito",
      folio: "981",
      fecha: "2026-11-17T08:51:54",
      moneda: "MXN",
      subtotal: "1460.00",
      total: "1693.60",
      emisor: "AGUACATES DE PUEBLA",
      emisorRfc: "AAP010101AAA",
      receptor: "Adolfo Rueda",
      receptorRfc: "HIL010101BBB",
      lineas: [{ descripcion: "FRAMBUESAS", cantidad: "5.000000", importe: "1460.00" }],
    });
  });

  it("no trata como CFDI un XML de otro tipo", () => {
    expect(leerCfdiParaVista('<Pedido id="1"/>')).toBeNull();
  });

  it("no duplica el guion si la serie ya lo trae", () => {
    const xml =
      '<?xml version="1.0"?>' +
      '<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Serie="DEVCAN-" Folio="991" TipoDeComprobante="E"/>';
    expect(leerCfdiParaVista(xml)?.folio).toBe("DEVCAN-991");
  });
});
