import {
  escribirFolioFactura,
  leerFolioFactura,
  payloadCapturaVacio,
} from "./folio-factura-captura";

describe("folio de factura en la captura", () => {
  it("lee facturaOkFolio antes que el alias", () => {
    expect(
      leerFolioFactura({
        facturaOkFolio: "001046",
        facturaAsociada: "999",
      }),
    ).toBe("001046");
  });

  it("usa el alias si la clave principal está vacía", () => {
    expect(leerFolioFactura({ facturaAsociada: " F-77 " })).toBe("F-77");
    expect(leerFolioFactura({ "Documentación folio": "FAC-10" })).toBe(
      "FAC-10",
    );
  });

  it("guarda el folio en facturaOkFolio y quita los alias", () => {
    const next = escribirFolioFactura(
      {
        ...payloadCapturaVacio(),
        campos: {
          facturaAsociada: "999",
          "Factura (OK) folio": "888",
          despachoNombre: "Ana",
        },
      },
      " 001046 ",
    );
    expect(next.campos).toEqual({
      facturaOkFolio: "001046",
      despachoNombre: "Ana",
    });
  });

  it("un folio vacío borra las claves y deja el resto de la captura", () => {
    const next = escribirFolioFactura(
      {
        campos: { facturaOkFolio: "001046", despachoNombre: "Ana" },
        checks: { incidenciaNinguna: true },
        lineas: [{ indice: 1, alisto: true }],
      },
      "   ",
    );
    expect(next.campos).toEqual({ despachoNombre: "Ana" });
    expect(next.checks.incidenciaNinguna).toBe(true);
    expect(next.lineas).toHaveLength(1);
    expect(leerFolioFactura(next.campos)).toBe("");
  });
});
