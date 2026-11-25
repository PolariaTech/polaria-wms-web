import { describe, expect, it } from "vitest";
import { textoPdf } from "../print/texto-pdf-flate";
import type { EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { documentoPrefactura, documentosPrefactura, type FiscalCompradorPrefactura } from "./prefactura-documento";
import { cajaDelLogo, renderPrefacturasPdf } from "./render-prefactura-pdf";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";

const PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
  (caracter) => caracter.charCodeAt(0),
);

const empresa: EmpresaPrefactura = {
  razonSocial: "Aguacates de puebla",
  rfc: "APU210325668",
  regimenFiscal: "601",
  codigoPostalExpedicion: "77560",
  nombreCuentaBancaria: "Aguacates de Puebla",
  banco: "BBVA",
  clabe: "012528001186364430",
  correoCobranza: "cobranza@aguacatesdepuebla.com",
  serieFactura: "CS-",
  logo: null,
};

function hojasDe(pdf: { internal: { pages: unknown[] } }): string[] {
  return pdf.internal.pages
    .filter((pagina) => pagina && typeof pagina === "object")
    .map((pagina) => Object.values(pagina as object).join("").match(/Hoja \d+/)?.[0] ?? "sin-hoja");
}

function ordenCon(cantidad: number): OrdenVentaDetalleRow {
  const base = orden();
  base.lineas = Array.from({ length: cantidad }, (_, indice) => ({
    id_linea_orden_venta: `l${indice}`,
    id_producto: "p1",
    cantidad_pedida: 1,
    precio_unitario: 1,
    unidad_medida: "KGM",
    producto: { sku: "AGU", descripcion: "AGUACATE MEDIANO", metadatos_catalogo: null },
  }));
  return base;
}

function orden(): OrdenVentaDetalleRow {
  return {
    codigo: "OV-9",
    fecha_pedido: "2026-11-18",
    comprador_razon_social: "HOTELERA CHICOME",
    comprador_rfc: "HCI780425689",
    lineas: [
      {
        id_linea_orden_venta: "l1",
        id_producto: "p1",
        cantidad_pedida: 1,
        precio_unitario: 69,
        unidad_medida: "KGM",
        producto: { sku: "AGU", descripcion: "AGUACATE MEDIANO", metadatos_catalogo: null },
      },
    ],
  } as OrdenVentaDetalleRow;
}

describe("renderPrefacturasPdf", () => {
  it("escribe la empresa, el cliente y el total, sin logo si todavía no hay", () => {
    const pdf = renderPrefacturasPdf([documentoPrefactura(empresa, orden())]);
    const texto = textoPdf(pdf);

    expect(texto).toContain("PREFACTURA");
    expect(texto).toContain("Aguacates de puebla");
    expect(texto).toContain("APU210325668");
    expect(texto).toContain("HOTELERA CHICOME");
    expect(texto).toContain("AGUACATE MEDIANO");
    expect(texto).toContain("$69.00");
    expect(texto).toContain("Prefactura sin timbre fiscal");
    expect(texto).toContain("601 · General de Ley Personas Morales");
    expect(texto).toContain("Orden de tarea");
    expect(texto).toContain("Orden de trabajo");
    expect(texto).toContain("Hoja 1");
    expect(texto).not.toContain("Hoja 2");
    expect(pdf.getNumberOfPages()).toBe(1);
  });

  it("numera las hojas de cada prefactura y vuelve a empezar en la siguiente", () => {
    const larga = renderPrefacturasPdf([documentoPrefactura(empresa, ordenCon(40))]);
    expect(hojasDe(larga)).toEqual(["Hoja 1", "Hoja 2"]);

    const dos = renderPrefacturasPdf([documentoPrefactura(empresa, orden()), documentoPrefactura(empresa, orden())]);
    expect(hojasDe(dos)).toEqual(["Hoja 1", "Hoja 1"]);
  });

  it("escribe el régimen y el pago del comprador con las etiquetas del receptor", () => {
    const fiscal: FiscalCompradorPrefactura = {
      regimenFiscal: "626 — RESICO",
      domicilioFiscal: "05348",
      metodoPago: "PPD — Parcialidades o diferido",
      formaPago: "99 — Por definir",
    };
    const texto = textoPdf(renderPrefacturasPdf([documentoPrefactura(empresa, orden(), fiscal)]));

    expect(texto).toContain("Régimen fiscal");
    expect(texto).toContain("601 · General de Ley Personas Morales");
    expect(texto).toContain("Régimen Fiscal");
    expect(texto).toContain("RESICO");
    expect(texto).toContain("Domicilio Fiscal");
    expect(texto).toContain("05348");
    expect(texto).toContain("Método de Pago");
    expect(texto).toContain("Parcialidades o diferido");
    expect(texto).toContain("Forma de Pago");
    expect(texto).toContain("Por definir");
  });

  it("ensancha el logo horizontal y deja cuadrado el que ya lo es", () => {
    const ancho = new Uint8Array(24);
    ancho.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const vista = new DataView(ancho.buffer);
    vista.setUint32(16, 274);
    vista.setUint32(20, 145);

    expect(cajaDelLogo({ bytes: ancho, formato: "PNG" })).toEqual({ ancho: 45.4, alto: 24 });
    expect(cajaDelLogo({ bytes: PNG, formato: "PNG" })).toEqual({ ancho: 24, alto: 24 });
  });

  it("escribe el folio completo de la OV debajo del QR, sin recortarlo", () => {
    const venta = orden();
    venta.codigo = "OV-00002487";
    const documento = documentoPrefactura(empresa, venta);
    documento.qrDataUrl = `data:image/png;base64,${btoa(String.fromCharCode(...PNG))}`;

    const texto = textoPdf(renderPrefacturasPdf([documento]));
    const fragmentos = [...texto.matchAll(/\(([^)]*)\)/g)].map((coincidencia) => coincidencia[1]);

    expect(fragmentos).toContain("OV-00002487");
    expect(fragmentos).not.toContain("OV-0000");
  });

  it("dibuja el logo cuando la empresa ya lo tiene", () => {
    const conLogo = documentoPrefactura({ ...empresa, logo: { bytes: PNG, formato: "PNG" } }, orden());

    expect(() => renderPrefacturasPdf([conLogo])).not.toThrow();
    expect(textoPdf(renderPrefacturasPdf([conLogo]))).toContain("PREFACTURA");
  });

  it("pinta el encabezado de partidas con el verde de la factura original", () => {
    const pdf = renderPrefacturasPdf([documentoPrefactura(empresa, orden())]);
    const contenido = pdf.internal.pages
      .filter((pagina) => pagina && typeof pagina === "object")
      .map((pagina) => Object.values(pagina as object).join(""))
      .join("");

    expect(contenido).toContain("0.67 0.81 0.42 rg");
  });

  it("escribe el nombre de cada orden de tarea en su prefactura", () => {
    const venta = orden();
    venta.lineas = [
      ...venta.lineas,
      {
        id_linea_orden_venta: "l2",
        id_producto: "p2",
        cantidad_pedida: 1,
        precio_unitario: 10,
        unidad_medida: "KGM",
        producto: { sku: "TOR", descripcion: "TORONJA LOCAL", metadatos_catalogo: null },
      },
    ];
    venta.origen_correo = [
      { Producto: "AGUACATE MEDIANO", Cantidad: 1, Almacen: "CANTINA", "Numero pedido": "OC-1", "Codigo producto": "AGU" },
      { Producto: "TORONJA LOCAL", Cantidad: 1, Almacen: "BAR", "Numero pedido": "OC-2", "Codigo producto": "TOR" },
    ];

    const pdf = renderPrefacturasPdf(documentosPrefactura(empresa, venta));
    const texto = textoPdf(pdf);

    expect(pdf.getNumberOfPages()).toBe(2);
    expect(texto).toContain("Orden de tarea");
    expect(texto).toContain("CANTINA");
  });

  it("rechaza una lista vacía", () => {
    expect(() => renderPrefacturasPdf([])).toThrow("No hay prefacturas para imprimir.");
  });
});
