import { describe, expect, it } from "vitest";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import { mapOrdenVentaToAlmacenPrintSheets } from "./map-orden-tarea-almacen";

const LIST_ROW: OrdenVentaOperadorRow = {
  idOrdenVenta: "ov-1",
  venta: "OV-001",
  occ: "—",
  occTodas: [],
  cuenta: "CUENTA-01",
  comprador: "Retail Norte",
  productos: "2 productos",
  cantidadKg: 15,
  total: 15000,
  estado: "confirmada",
  fecha: "2026-06-28T12:00:00.000Z",
  ordenesTrabajo: 2,
  destino: "Bodega central",
  idBodega: "bod-1",
  idBodegaDestino: null,
  slaStatus: "en_tiempo",
  alertaStatus: "ok",
  minutosEnEstado: 0,
  slaMinutos: 60,
  alertaMinutos: 45,
};

const DETALLE_BASE: OrdenVentaDetalleRow = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "bod-1",
  id_cliente: "cli-1",
  id_comprador: "comp-1",
  id_planta: null,
  id_creador: null,
  id_bodega_destino: null,
  codigo: "OV-001",
  estado: "confirmada",
  fecha_pedido: "2026-06-28T12:00:00.000Z",
  observaciones: null,
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
  comprador_nombre: "Edgar Escobar",
  comprador_codigo: "3Q12U",
  bodega_nombre: "Bodega central",
  bodega_destino_nombre: null,
  centro_consumo: "CABECERA OV UNICA",
  lineas: [
    {
      id_linea_orden_venta: "l1",
      id_producto: "p1",
      cantidad_pedida: 10,
      precio_unitario: 100,
      producto: { sku: "A", descripcion: "Producto A" },
    },
    {
      id_linea_orden_venta: "l2",
      id_producto: "p2",
      cantidad_pedida: 5,
      precio_unitario: 200,
      producto: { sku: "B", descripcion: "Producto B" },
    },
  ],
};

describe("REQ-344: centros de consumo por OT en impresión", () => {
  it("cada hoja usa el Almacen de su OT aunque la OV tenga un solo centro", () => {
    const sheets = mapOrdenVentaToAlmacenPrintSheets({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE_BASE,
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
    expect(sheets[0]?.centroConsumo).toBe("Bar");
    expect(sheets[1]?.centroConsumo).toBe("Cocina");
  });
});
