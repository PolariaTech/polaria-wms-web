import { describe, expect, it } from "vitest";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import type { EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { documentoPrefactura, documentosPrefactura, etiquetaRegimen, type FiscalCompradorPrefactura } from "./prefactura-documento";

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
    expect(doc.ordenTarea).toBe("Orden de trabajo");
  });

  it("toma régimen, domicilio fiscal y pago del comprador sin cambiar el de la empresa", () => {
    const fiscal: FiscalCompradorPrefactura = {
      regimenFiscal: "626 — RESICO",
      domicilioFiscal: "05348",
      metodoPago: "PPD — Parcialidades o diferido",
      formaPago: "99 — Por definir",
    };
    const doc = documentoPrefactura(empresa, detalle(), fiscal);

    expect(doc.regimen).toBe("601 · General de Ley Personas Morales");
    expect(doc.regimenComprador).toBe("626 — RESICO");
    expect(doc.domicilioFiscal).toBe("05348");
    expect(doc.metodoPago).toBe("PPD — Parcialidades o diferido");
    expect(doc.formaPago).toBe("99 — Por definir");
  });

  it("deja el logo vacío cuando la empresa todavía no lo tiene", () => {
    expect(documentoPrefactura(empresa, detalle()).logo).toBeNull();
  });

  it("rechaza una orden sin partidas", () => {
    const vacia = { ...detalle(), lineas: [] };
    expect(() => documentoPrefactura(empresa, vacia)).toThrow(/no tiene partidas/);
  });

  it("arma una prefactura por orden de tarea y pone el nombre de cada una", () => {
    const orden = detalle();
    orden.origen_correo = [
      { Producto: "AGUACATE MEDIANO", Cantidad: 1, Almacen: "CANTINA", "Numero pedido": "OC-1", "Codigo producto": "AGU" },
      { Producto: "TORONJA LOCAL", Cantidad: 2, Almacen: "BAR", "Numero pedido": "OC-2", "Codigo producto": "TOR" },
    ];

    const documentos = documentosPrefactura(empresa, orden);

    expect(documentos).toHaveLength(2);
    expect(documentos[0]?.ordenTarea).toBe("OC-1 — CANTINA");
    expect(documentos[0]?.numeroOt).toBe("OC-1");
    expect(documentos[0]?.centroConsumo).toBe("CANTINA");
    expect(documentos[1]?.numeroOt).toBe("OC-2");
    expect(documentos[1]?.totalOt).toBe("2");
    expect(documentos[1]?.centroConsumo).toBe("BAR");
    expect(documentos[0]?.partidas.map((partida) => partida.descripcion)).toEqual(["AGUACATE MEDIANO"]);
    expect(documentos[0]?.total).toBe("$35.00");
    expect(documentos[1]?.ordenTarea).toBe("OC-2 — BAR");
    expect(documentos[1]?.partidas.map((partida) => partida.descripcion)).toEqual(["TORONJA LOCAL"]);
    expect(documentos[1]?.total).toBe("$34.00");
    expect(() => documentoPrefactura(empresa, orden)).toThrow(/2 órdenes de tarea/);
  });

  it("con diez órdenes de tarea devuelve diez prefacturas", () => {
    const orden = detalle();
    orden.lineas = Array.from({ length: 10 }, (_, indice) => ({
      id_linea_orden_venta: `l${indice}`,
      id_producto: `p${indice}`,
      cantidad_pedida: 1,
      precio_unitario: indice + 1,
      unidad_medida: "KGM",
      producto: { sku: `SKU${indice}`, descripcion: `FRUTA${indice}UNICA`, metadatos_catalogo: null },
    }));
    orden.origen_correo = Array.from({ length: 10 }, (_, indice) => ({
      Producto: `FRUTA${indice}UNICA`,
      Cantidad: 1,
      Almacen: `COCINA ${indice}`,
      "Numero pedido": `P${indice}`,
      "Codigo producto": `SKU${indice}`,
    }));

    const documentos = documentosPrefactura(empresa, orden);

    expect(documentos).toHaveLength(10);
    expect(documentos.map((doc) => doc.ordenTarea)).toEqual(
      Array.from({ length: 10 }, (_, indice) => `P${indice} — COCINA ${indice}`),
    );
    expect(documentos[9]?.total).toBe("$10.00");
  });
});

describe("etiquetaRegimen", () => {
  it("deja el código tal cual si no está en el catálogo", () => {
    expect(etiquetaRegimen("999")).toBe("999");
    expect(etiquetaRegimen(null)).toBe("");
  });
});
