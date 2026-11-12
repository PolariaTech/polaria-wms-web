import { describe, expect, it } from "vitest";
import {
  especificacionVisible,
  leerFolioFacturaVista,
  montoDeNota,
  notasVanTrasCentroConsumo,
  porcentajeDeNota,
  resolveNumeroOrdenClientePrint,
  textoConteoOrdenesTrabajo,
  textoConteoProductos,
  tituloDetalleOvConOt,
  totalLineaConIva,
} from "./detalle-venta-presentacion";

describe("detalle de venta", () => {
  it("lee el folio exacto y también un alias en otro caso", () => {
    expect(leerFolioFacturaVista({ facturaOkFolio: "001046", Folio: "viejo" })).toBe(
      "001046",
    );
    expect(leerFolioFacturaVista({ "documentación folio": "F-77" })).toBe("F-77");
    expect(leerFolioFacturaVista(undefined)).toBe("");
  });

  it("lee IVA y rechaza texto inválido (REQ-218: sin desc)", () => {
    expect(porcentajeDeNota("IVA 16%", "IVA")).toBe(16);
    expect(porcentajeDeNota("", "IVA")).toBe(0);
  });

  it("quita restos desc e IVA de la especificación", () => {
    expect(especificacionVisible("fresa · desc 10% · IVA 16%")).toBe("fresa");
  });

  it("calcula importe sin descuento e IVA (REQ-218)", () => {
    const monto = montoDeNota("desc 10% · IVA 16%", 2, 100);
    expect(monto.importe).toBe(200);
    expect(monto.iva).toBeCloseTo(32);
    expect(totalLineaConIva(2, 100, "desc 10% · IVA 16%")).toBeCloseTo(232);
  });

  it("cuenta una orden y varias", () => {
    expect(textoConteoOrdenesTrabajo(1)).toBe("1 orden de trabajo");
    expect(textoConteoOrdenesTrabajo(3)).toBe("3 órdenes de trabajo");
  });

  it("cuenta productos sin unidad (REQ-224)", () => {
    expect(textoConteoProductos(1)).toBe("1 producto");
    expect(textoConteoProductos(10)).toBe("10 productos");
  });

  it("arma el título OV-#OT en multi-OT (REQ-229)", () => {
    expect(tituloDetalleOvConOt("OV-00001047", 1, 2)).toBe("OV-00001047-1");
    expect(tituloDetalleOvConOt("OV-00001047", 2, 2)).toBe("OV-00001047-2");
    expect(tituloDetalleOvConOt("OV-00001047", 1, 1)).toBe("OV-00001047");
    expect(tituloDetalleOvConOt("", 1, 3)).toBe("OV-1");
  });

  it("OCC print: 1 OT prioriza cabecera; multi-OT prioriza hija (REQ-176)", () => {
    expect(
      resolveNumeroOrdenClientePrint({
        ordenCompraHotel: "11948",
        hijaNumeroPedido: "ADP-x",
        capturaOrdenCompra: "viejo",
        tareaTotal: 1,
      }),
    ).toBe("11948");
    expect(
      resolveNumeroOrdenClientePrint({
        ordenCompraHotel: "11948",
        hijaNumeroPedido: "PO-OT-2",
        tareaTotal: 2,
      }),
    ).toBe("PO-OT-2");
  });

  it("OCC print no usa el folio OV", () => {
    expect(
      resolveNumeroOrdenClientePrint({
        ordenCompraHotel: "11948",
        hijaNumeroPedido: "ADP-x",
        tareaTotal: 1,
      }),
    ).not.toBe("OV-001");
  });

  it("Notas generales van justo después de Centro de consumo (REQ-215)", () => {
    expect(
      notasVanTrasCentroConsumo([
        "Centro de consumo",
        "Notas generales",
        "Fecha de entrega",
      ]),
    ).toBe(true);
    expect(
      notasVanTrasCentroConsumo([
        "Centro de consumo",
        "Fecha de entrega",
        "Notas generales",
      ]),
    ).toBe(false);
  });
});

