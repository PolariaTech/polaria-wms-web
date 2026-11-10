import { describe, expect, it } from "vitest";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import { buildOrdenTareaAlmacenHtml } from "./build-orden-tarea-almacen-html";
import { buildOrdenTareaAlmacenLandscapePdfMulti } from "./render-orden-tarea-almacen-landscape-pdf";
import { mapOrdenVentaToAlmacenPrintSheets } from "./map-orden-tarea-almacen";

const LIST_ROW: OrdenVentaOperadorRow = {
  idOrdenVenta: "ov-1",
  venta: "OV-001",
  occ: "—",
  occTodas: [],
  cuenta: "CUENTA-01",
  comprador: "Retail Norte",
  productos: "1 producto",
  cantidadKg: 10,
  total: 10000,
  estado: "por_confirmar",
  fecha: "2026-06-28T12:00:00.000Z",
  ordenesTrabajo: 1,
  destino: "Bodega central",
  idBodega: "bod-1",
  idBodegaDestino: null,
  slaStatus: "en_tiempo",
  alertaStatus: "ok",
  minutosEnEstado: 0,
  slaMinutos: 60,
  alertaMinutos: 45,
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
  estado: "por_confirmar",
  fecha_pedido: "2026-06-28T12:00:00.000Z",
  observaciones: null,
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
  comprador_nombre: "Edgar Escobar",
  comprador_codigo: "3Q12U",
  bodega_nombre: "Bodega central",
  bodega_destino_nombre: null,
  lineas: [],
};

describe("paginación OT almacén (REQ-269)", () => {
  it("parte una OT en hojas de 30 productos y etiqueta 1-n/N", () => {
    const lineas = Array.from({ length: 50 }, (_, i) => ({
      id_linea_orden_venta: `l-${i + 1}`,
      id_producto: `p-${i + 1}`,
      cantidad_pedida: 1,
      precio_unitario: 10,
      producto: {
        sku: `SKU-${i + 1}`,
        descripcion: `Producto ${i + 1}`,
      },
    }));
    const origenOt1 = Array.from({ length: 50 }, (_, i) => ({
      "Numero pedido": "100",
      Almacen: "Bar",
      Producto: `Producto ${i + 1}`,
      Cantidad: 1,
    }));
    const sheets = mapOrdenVentaToAlmacenPrintSheets({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        lineas: [
          ...lineas,
          {
            id_linea_orden_venta: "l-b",
            id_producto: "p-b",
            cantidad_pedida: 5,
            precio_unitario: 200,
            producto: { sku: "B", descripcion: "Producto B" },
          },
        ],
        origen_correo: [
          ...origenOt1,
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

    expect(sheets).toHaveLength(3);
    expect(sheets[0]?.ordenTrabajo).toBe("1-1/2");
    expect(sheets[0]?.lineas).toHaveLength(30);
    expect(sheets[0]?.lineaInicio).toBe(1);
    expect(sheets[1]?.ordenTrabajo).toBe("2-1/2");
    expect(sheets[1]?.lineas).toHaveLength(20);
    expect(sheets[1]?.lineaInicio).toBe(31);
    expect(sheets[1]?.idOrdenTrabajo).toBe(sheets[0]?.idOrdenTrabajo);
    expect(sheets[2]?.ordenTrabajo).toBe("2/2");
    expect(sheets[2]?.lineas).toHaveLength(1);
    expect(sheets[2]?.idOrdenTrabajo).not.toBe(sheets[0]?.idOrdenTrabajo);

    const html = buildOrdenTareaAlmacenHtml(sheets[1]!);
    expect(html).toContain("2-1/2");
    expect(html).toContain(">31<");

    const multi = buildOrdenTareaAlmacenLandscapePdfMulti(sheets);
    expect(multi.getNumberOfPages()).toBe(3);
  });
});
