import { describe, expect, it } from "vitest";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import { buildOrdenTareaAlmacenHtml } from "./build-orden-tarea-almacen-html";
import { mapOrdenVentaToAlmacenPrintData } from "./map-orden-tarea-almacen";
import { buildOrdenTareaAlmacenPdf } from "./render-orden-tarea-almacen-pdf";

const LIST_ROW: OrdenVentaOperadorRow = {
  idOrdenVenta: "ov-1",
  venta: "OV-001",
  cuenta: "CUENTA-01",
  comprador: "Retail Norte",
  productos: "1 producto",
  cantidadKg: 10,
  total: 10000,
  estado: "borrador",
  fecha: "2026-06-28T12:00:00.000Z",
  destino: "Bodega central",
};

const DETALLE: OrdenVentaDetalleRow = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "bod-1",
  id_cliente: "cli-1",
  id_comprador: "comp-1",
  id_planta: null,
  id_creador: null,
  id_bodega_destino: null,
  codigo: "OV-001",
  estado: "borrador",
  fecha_pedido: "2026-06-28T12:00:00.000Z",
  observaciones: null,
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
  comprador_nombre: "Edgar Escobar",
  comprador_codigo: "3Q12U",
  bodega_nombre: "Bodega central",
  bodega_destino_nombre: null,
  lineas: [
    {
      id_linea_orden_venta: "line-1",
      id_producto: "prod-1",
      cantidad_pedida: 10,
      precio_unitario: 1000,
      producto: {
        sku: "IOZ7Z",
        descripcion: "Pork racks",
        metadatos_catalogo: { titulo: "HPR FROZEN-PORK RACKS" },
      },
    },
  ],
};

describe("orden de tarea almacén", () => {
  it("mapea folio, cliente y productos de la venta", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(data.folio).toBe("OV-001");
    expect(data.cliente).toContain("Edgar Escobar");
    expect(data.lineas[0]?.producto).toBe("HPR FROZEN-PORK RACKS");
    expect(data.lineas[0]?.especificacion).toBe("");
    expect(data.lineas[0]?.cantidadSolicitada).toContain("10");
  });

  it("lee centro, entrega y especificación desde la captura del pedido", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        observaciones: [
          "Fecha de entrega: 2026-09-03",
          "Orden de compra del hotel: OC-88",
          "Centro de consumo: Cocina de banquetes",
          "Dirección de entrega: Km 282",
          "",
          "HPR FROZEN-PORK RACKS: Firme · 2 cajas",
        ].join("\n"),
      },
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(data.centroConsumo).toBe("Cocina de banquetes");
    expect(data.numeroOrdenCliente).toBe("OC-88");
    expect(data.fechaEntrega).toBe("03/09/2026");
    expect(data.direccionEntrega).toBe("Km 282");
    expect(data.lineas[0]?.especificacion).toBe("Firme · 2 cajas");
  });

  it("incluye folio y productos en el HTML de la hoja", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });
    const html = buildOrdenTareaAlmacenHtml(data);

    expect(html).toContain("OV-001");
    expect(html).toContain("HPR FROZEN-PORK RACKS");
    expect(html).toContain("ORDEN DE VENTA");
    expect(html).toContain("216mm 330mm");
    expect(html).not.toContain("IOZ7Z");
    expect(html).not.toContain("Si algo no salió");
    expect(html).toContain("<th class=\"c\">Alistó</th>");
    expect(html).toContain("<th class=\"c\">Revisó</th>");
    expect(html).not.toContain("No había suficiente");
  });

  it("deja la especificación vacía si el pedido no trajo nota de línea", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
    });
    expect(data.lineas[0]?.especificacion).toBe("");
  });

  it("mantiene una sola hoja aunque la dirección sea larga", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        observaciones: [
          "Dirección de entrega: Carretera Chetumal—Puerto Juárez Km 282, Solidaridad, Q. Roo CP 77710 — Si — más de 30 km en tramo federal",
        ].join("\n"),
      },
      printedAt: new Date("2026-08-26T17:44:00"),
    });
    const pdf = buildOrdenTareaAlmacenPdf(data);
    expect(pdf.getNumberOfPages()).toBe(1);
    expect(data.direccionEntrega).toContain("Km 282");
  });

  it("genera un PDF de una hoja oficio con folio y cliente", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });
    const pdf = buildOrdenTareaAlmacenPdf(data);
    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdf.internal.pageSize.getWidth()).toBe(216);
    expect(pdf.internal.pageSize.getHeight()).toBe(330);
  });
});
