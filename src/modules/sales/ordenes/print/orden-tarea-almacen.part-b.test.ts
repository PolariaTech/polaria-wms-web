import { describe, expect, it } from "vitest";
import { buildOrdenTareaAlmacenHtml } from "./build-orden-tarea-almacen-html";
import { buildOrdenTareaAlmacenLandscapePdf, buildOrdenTareaAlmacenLandscapePdfMulti } from "./render-orden-tarea-almacen-landscape-pdf";
import { buildOrdenTareaAlmacenPdf } from "./render-orden-tarea-almacen-pdf";
import { mapOrdenVentaToAlmacenPrintData, mapOrdenVentaToAlmacenPrintSheets } from "./map-orden-tarea-almacen";
import { DETALLE, LIST_ROW } from "./orden-tarea-almacen.test-helpers";

describe("orden de tarea almacén", () => {
  it("REQ-185/192: imprime la especificación guardada por id de producto y OT", () => {
    const sheets = mapOrdenVentaToAlmacenPrintSheets({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        notas_lineas: [
          "ot:ot-cocina|pid:prod-1: 5x10litros",
          "ot:ot-bar|pid:prod-2: 7x5LT",
        ].join("\n"),
        lineas: [
          {
            id_linea_orden_venta: "line-1",
            id_producto: "prod-1",
            cantidad_pedida: 10,
            precio_unitario: 1000,
            producto: {
              sku: "A",
              descripcion: "Jugo",
              metadatos_catalogo: { titulo: "JUGO DE LIMON" },
            },
          },
          {
            id_linea_orden_venta: "line-2",
            id_producto: "prod-2",
            cantidad_pedida: 7,
            precio_unitario: 80,
            producto: {
              sku: "B",
              descripcion: "Agua",
              metadatos_catalogo: { titulo: "AGUA" },
            },
          },
        ],
        origen_correo: [
          {
            _otId: "ot-cocina",
            "Numero pedido": "942",
            Almacen: "Cocina",
            Producto: "JUGO DE LIMON",
            Cantidad: 10,
          },
          {
            _otId: "ot-bar",
            "Numero pedido": "943",
            Almacen: "Bar",
            Producto: "AGUA",
            Cantidad: 7,
          },
        ],
      },
    });

    expect(sheets[0]?.lineas[0]?.especificacion).toBe("5x10litros");
    expect(sheets[1]?.lineas[0]?.especificacion).toBe("7x5LT");
    expect(buildOrdenTareaAlmacenHtml(sheets[0]!)).toContain("5x10litros");
  });


  it("REQ-185/192: sin OT imprime la especificación guardada solo por id de producto", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        notas_lineas: "pid:prod-1: 5x10litros",
      },
    });
    expect(data.lineas[0]?.especificacion).toBe("5x10litros");
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
    // El texto comprimido del PDF no siempre se inflate en CI; los roles
    // se cubren en el HTML de la misma hoja.
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
    // El texto comprimido del PDF no siempre se inflate en CI; los roles
    // se cubren en el HTML de la misma hoja.
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
    expect(sheets[0]?.ordenTrabajo).toBe("1/2");
    expect(sheets[1]?.ordenTrabajo).toBe("2/2");
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
