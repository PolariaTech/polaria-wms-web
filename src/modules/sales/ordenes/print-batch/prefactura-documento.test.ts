import { describe, expect, it } from "vitest";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import type { EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { documentoPrefactura, etiquetaRegimen } from "./prefactura-documento";

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

function detalle(): OrdenVentaDetalleRow {
  return {
    codigo: "OV-1",
    fecha_pedido: "2026-11-18",
    comprador_razon_social: "HOTELERA CHICOME",
    comprador_rfc: "HCI780425689",
    direccion_entrega: "Cancún",
    moneda: "MXN",
    orden_compra_hotel: "PRUEBA API 01",
    vendedor: "Ana",
    lineas: [
      {
        id_linea_orden_venta: "l1",
        id_producto: "p1",
        cantidad_pedida: 1,
        precio_unitario: 35,
        unidad_medida: "KGM",
        producto: { sku: "AGU", descripcion: "AGUACATE MEDIANO", metadatos_catalogo: null },
      },
      {
        id_linea_orden_venta: "l2",
        id_producto: "p2",
        cantidad_pedida: 2,
        precio_unitario: 17,
        unidad_medida: null,
        producto: { sku: "TOR", descripcion: "TORONJA LOCAL", metadatos_catalogo: null },
      },
    ],
  } as OrdenVentaDetalleRow;
}

describe("documentoPrefactura", () => {
  it("toma la empresa de public y el cliente y las partidas de la orden", () => {
    const doc = documentoPrefactura(empresa, detalle());

    expect(doc.razonSocial).toBe("Aguacates de puebla");
    expect(doc.regimen).toBe("601 · General de Ley Personas Morales");
    expect(doc.cliente).toBe("HOTELERA CHICOME");
    expect(doc.rfcCliente).toBe("HCI780425689");
    expect(doc.partidas).toHaveLength(2);
    expect(doc.total).toBe("$69.00");
    expect(doc.totalLetra).toBe("sesenta y nueve Pesos 00/100 M.N.");
    expect(doc.clabe).toBe("012528001186364430");
  });

  it("deja el logo vacío cuando la empresa todavía no lo tiene", () => {
    expect(documentoPrefactura(empresa, detalle()).logo).toBeNull();
  });

  it("rechaza una orden sin partidas", () => {
    const vacia = { ...detalle(), lineas: [] };
    expect(() => documentoPrefactura(empresa, vacia)).toThrow(/no tiene partidas/);
  });
});

describe("etiquetaRegimen", () => {
  it("deja el código tal cual si no está en el catálogo", () => {
    expect(etiquetaRegimen("999")).toBe("999");
    expect(etiquetaRegimen(null)).toBe("");
  });
});
