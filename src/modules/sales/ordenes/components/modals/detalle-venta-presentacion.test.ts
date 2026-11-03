import { describe, expect, it } from "vitest";
import {
  especificacionVisible,
  leerFolioFacturaVista,
  montoDeNota,
  porcentajeDeNota,
  textoConteoOrdenesTrabajo,
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

  it("tope de descuento, IVA y texto inválido", () => {
    expect(porcentajeDeNota("· desc 150%", "desc")).toBe(100);
    expect(porcentajeDeNota("IVA 16%", "IVA")).toBe(16);
    expect(porcentajeDeNota("desc no", "desc")).toBe(0);
    expect(porcentajeDeNota("", "IVA")).toBe(0);
  });

  it("quita descuento e IVA de la especificación", () => {
    expect(especificacionVisible("fresa · desc 10% · IVA 16%")).toBe("fresa");
  });

  it("calcula importe y total con descuento e IVA", () => {
    const monto = montoDeNota("desc 10% · IVA 16%", 2, 100);
    expect(monto.importe).toBe(180);
    expect(monto.iva).toBeCloseTo(28.8);
    expect(totalLineaConIva(2, 100, "desc 10% · IVA 16%")).toBeCloseTo(208.8);
  });

  it("cuenta una orden y varias", () => {
    expect(textoConteoOrdenesTrabajo(1)).toBe("1 orden de trabajo");
    expect(textoConteoOrdenesTrabajo(3)).toBe("3 órdenes de trabajo");
  });
});
