import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import { textoPdf } from "../print/texto-pdf-flate";
import { blobPrefactura } from "./blob-prefactura";
import { FISCAL_COMPRADOR_VACIO } from "./prefactura-documento";

vi.mock("./cargar-empresa-prefactura", () => ({
  cargarEmpresaPrefactura: vi.fn(async () => ({
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
  })),
}));

vi.mock("./cargar-comprador-prefactura", () => ({
  cargarCompradorPrefactura: vi.fn(async () => ({ ...FISCAL_COMPRADOR_VACIO })),
}));

function detalle(): OrdenVentaDetalleRow {
  return {
    codigo: "OV-9",
    id_comprador: "comp-1",
    fecha_pedido: "2026-11-18",
    comprador_razon_social: "HOTELERA CHICOME",
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

describe("blobPrefactura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("arma el PDF de esa OV con la misma empresa y el mismo render", async () => {
    const { cargarEmpresaPrefactura } = await import("./cargar-empresa-prefactura");
    const { cargarCompradorPrefactura } = await import("./cargar-comprador-prefactura");
    const blob = await blobPrefactura(detalle(), "Y9IHZ");
    const buffer = await blob.arrayBuffer();
    const texto = textoPdf({ output: () => buffer });

    expect(cargarEmpresaPrefactura).toHaveBeenCalledWith("Y9IHZ");
    expect(cargarCompradorPrefactura).toHaveBeenCalledWith("comp-1");
    expect(blob.type).toBe("application/pdf");
    expect(texto).toContain("PREFACTURA");
    expect(texto).toContain("Aguacates de puebla");
    expect(texto).toContain("AGUACATE MEDIANO");
  });
});
