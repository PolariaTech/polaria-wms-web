import { describe, expect, it } from "vitest";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import { buildOrdenTareaAlmacenHtml } from "./build-orden-tarea-almacen-html";
import { buildOrdenTareaAlmacenLandscapePdf, buildOrdenTareaAlmacenLandscapePdfMulti } from "./render-orden-tarea-almacen-landscape-pdf";
import { buildOrdenTareaAlmacenPdf } from "./render-orden-tarea-almacen-pdf";
import { mapOrdenVentaToAlmacenPrintData, mapOrdenVentaToAlmacenPrintSheets } from "./map-orden-tarea-almacen";

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
  idBodega: "bod-1",
  idBodegaDestino: null,
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
  it("pone el body del correo/mensaje en notas generales", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        origen_texto: "Pedido de FYV para Hotel Ava. Llevar 3 juegos.",
        notas_almacen: "nota interna almacén",
      },
    });
    expect(data.notasGenerales).toContain("Pedido de FYV");
    expect(data.notasGenerales).not.toContain("nota interna");
  });

  it("mapea folio, cliente y productos de la venta", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(data.folio).toBe("OV-001");
    expect(data.cliente).toBe("Edgar Escobar");
    expect(data.cliente).not.toContain("3Q12U");
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
    expect(html).toContain("<label>Tarea de Almacen</label>");
    expect(html).toContain("HPR FROZEN-PORK RACKS");
    expect(html).not.toContain("ORDEN DE VENTA");
    expect(html).not.toContain("<label>Orden de venta</label>");
    expect(html).not.toContain(">Folio<");
    expect(html).not.toContain("<label>Folio</label>");
    expect(html).toContain("216mm 330mm");
    expect(html).not.toContain("IOZ7Z");
    expect(html).not.toContain("Si algo no salió");
    expect(html).toContain("<th class=\"c\">Alistó</th>");
    expect(html).toContain("<th class=\"c\">Revisó</th>");
    expect(html).toContain("Hora de entrega");
    expect(html).not.toContain("Notas generales");
    expect(html).toContain("Cliente");
    expect(html).toContain("Centro de consumo");
    expect(html).not.toContain("Centro de consumo / cocina");
    expect(html).toContain("Fecha de entrega");
    expect(html).toContain("Dirección de entrega");
    expect(html).toContain("# de orden del cliente");
    expect(html).toContain("Factura asociada");
    expect(html).toContain("Escanear y fotografiar");
    expect(html).not.toContain("<label>Impresa</label>");
    expect(html).not.toContain("Turno que prepara");
    expect(html).not.toContain("Chofer");
    expect(html).not.toContain("Hora comprometida");
    expect(html).not.toContain("Hora sugerida de salida");
    expect(html).not.toContain("Cant. preparada");
    expect(html).not.toContain("Códigos:");
    expect(html).not.toContain("Renglones en esta orden");
    expect(html).not.toContain("No había suficiente");
    expect(html).not.toContain("Recepción del cliente");
    expect(html).not.toContain("Sello y firma del cliente");
    expect(html).not.toContain("De la orden completa");
    expect(html).not.toContain("Si algo no se puede surtir");
    expect(html).not.toContain("coincide con la factura impresa");
    expect(html).not.toContain("Responsables");
    expect(html).not.toContain("Documentó");
    expect(html).not.toContain("Turno PM");
    expect(html).not.toContain("Noche / AM");
    expect(html).not.toContain("Facturó");
    expect(html).toContain("Factura (OK)");
    expect(html).toContain("Retorno");
    expect(html).toContain("Despachó");
    expect(html).toContain("Nombre");
    expect(html).toContain("Firma");
    expect(html).not.toContain("Cómo se llena");
    expect(html).not.toContain("Foto:");
    expect(html).not.toContain("Notas generales:");
    expect(html).not.toContain("Notas:");
    expect(html).toContain("Incidencias");
    expect(html).not.toContain(">Productos<");
    expect(html).toContain("page-meta");
    expect(html).toContain("Orden de tarea 1/1");
    expect(html).not.toContain("Hoja 1 de 1");
    expect(html).not.toMatch(/page-meta[^>]*>OV-/);
    expect(html).toContain('class="notes-block"');
    expect(html).toContain('colspan="3"');
    expect(html).toContain('class="products-wrap"');
    expect(html).toContain('class="n">26</td>');
    expect(html).toContain('class="n">50</td>');
  });

  it("deja la especificación vacía si el pedido no trajo nota de línea", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
    });
    expect(data.lineas[0]?.especificacion).toBe("");
  });

  it("cabe en una sola hoja carta aunque la dirección sea larga", () => {
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

  it("genera un PDF carta de una hoja con folio", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });
    const pdf = buildOrdenTareaAlmacenPdf(data);
    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(215.9, 1);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(279.4, 1);
  });

  it("genera PDF horizontal en 2 divisiones con los mismos campos", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });
    const pdf = buildOrdenTareaAlmacenLandscapePdf(data);
    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(215.9, 1);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(279.4, 1);
  });

  it("parte origen_correo en una hoja por orden de trabajo con índice n/N", () => {
    const sheets = mapOrdenVentaToAlmacenPrintSheets({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        lineas: [
          {
            id_linea_orden_venta: "l1",
            id_producto: "p1",
            cantidad_pedida: 10,
            precio_unitario: 100,
            producto: {
              sku: "A",
              descripcion: "Producto A",
            },
          },
          {
            id_linea_orden_venta: "l2",
            id_producto: "p2",
            cantidad_pedida: 5,
            precio_unitario: 200,
            producto: {
              sku: "B",
              descripcion: "Producto B",
            },
          },
        ],
        origen_correo: [
          {
            "Numero pedido": "100",
            Almacen: "Bar",
            Producto: "Producto A",
            Cantidad: 10,
          },
          {
            "Numero pedido": "200",
            Almacen: "Cocina",
            Producto: "Producto B",
            Cantidad: 5,
          },
        ],
      },
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(sheets).toHaveLength(2);
    expect(sheets[0]?.tareaIndex).toBe(1);
    expect(sheets[0]?.tareaTotal).toBe(2);
    expect(sheets[1]?.tareaIndex).toBe(2);
    expect(sheets[1]?.tareaTotal).toBe(2);
    expect(sheets[0]?.idOrdenTrabajo).not.toBe(sheets[1]?.idOrdenTrabajo);
    expect(sheets.every((s) => s.lineas.length === 1)).toBe(true);

    const pdf = buildOrdenTareaAlmacenLandscapePdf(sheets[1]!);
    expect(sheets[1]?.tareaIndex).toBe(2);
    expect(pdf.getNumberOfPages()).toBe(1);

    const multi = buildOrdenTareaAlmacenLandscapePdfMulti(sheets);
    expect(multi.getNumberOfPages()).toBe(2);
  });
});
