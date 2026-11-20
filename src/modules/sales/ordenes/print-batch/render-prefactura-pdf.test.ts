import { describe, expect, it } from "vitest";
import { textoPdf } from "../print/texto-pdf-flate";
import type { EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { documentoPrefactura } from "./prefactura-documento";
import { renderPrefacturasPdf } from "./render-prefactura-pdf";
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
    expect(pdf.getNumberOfPages()).toBe(1);
  });

  it("dibuja el logo cuando la empresa ya lo tiene", () => {
    const conLogo = documentoPrefactura({ ...empresa, logo: { bytes: PNG, formato: "PNG" } }, orden());

    expect(() => renderPrefacturasPdf([conLogo])).not.toThrow();
    expect(textoPdf(renderPrefacturasPdf([conLogo]))).toContain("PREFACTURA");
  });

  it("rechaza una lista vacía", () => {
    expect(() => renderPrefacturasPdf([])).toThrow("No hay prefacturas para imprimir.");
  });
});
