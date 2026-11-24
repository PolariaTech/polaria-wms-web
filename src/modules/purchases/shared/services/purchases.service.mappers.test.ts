import { describe, expect, it } from "vitest";
import {
  mapOrdenCompraLineaListRow,
  mapOrdenCompraLineaNotifyRow,
  mapOrdenCompraRow,
  mapSolicitudCompraLineaRow,
  mapSolicitudCompraRow,
  ORDEN_COLUMNS,
  SOLICITUD_COLUMNS,
  type OrdenCompraDbRow,
  type SolicitudCompraDbRow,
} from "./purchases.service.mappers";

describe("purchases.service.mappers", () => {
  it("exporta columnas de selección", () => {
    expect(SOLICITUD_COLUMNS).toContain("solicitud_compra_linea(");
    expect(ORDEN_COLUMNS).toContain("orden_compra_linea(");
  });

  it("mapOrdenCompraLineaListRow convierte cantidades y resuelve arrays", () => {
    const row = mapOrdenCompraLineaListRow({
      id_linea_orden_compra: "l-1",
      id_producto: "p-1",
      cantidad: "12.5",
      cantidad_recibida: null,
      producto: [{ sku: "SKU1", descripcion: "Desc" }],
    } as never);

    expect(row.cantidad).toBe(12.5);
    expect(row.cantidad_recibida).toBe(0);
    expect(row.producto).toEqual({ sku: "SKU1", descripcion: "Desc" });
  });

  it("mapOrdenCompraRow resuelve líneas vacías", () => {
    const row = mapOrdenCompraRow({
      id_orden_compra: "oc-1",
      proveedor: null,
      orden_compra_linea: null,
    } as unknown as OrdenCompraDbRow);

    expect(row.lineas).toEqual([]);
    expect(row.proveedor_nombre).toBeNull();
  });

  it("mapOrdenCompraLineaNotifyRow descarta filas sin sku o cantidad", () => {
    expect(
      mapOrdenCompraLineaNotifyRow({ cantidad: 3, producto: null }),
    ).toBeNull();
    expect(
      mapOrdenCompraLineaNotifyRow({
        cantidad: 0,
        producto: { sku: "A", unidad_medida: null },
      }),
    ).toBeNull();
    expect(
      mapOrdenCompraLineaNotifyRow({
        cantidad: "4",
        producto: { sku: "A", unidad_medida: null },
      }),
    ).toEqual({ sku: "A", cantidad: 4, unidad: "und" });
  });

  it("mapSolicitudCompraRow mapea líneas", () => {
    const linea = mapSolicitudCompraLineaRow({
      id_linea_solicitud_compra: "ls-1",
      id_producto: "p-1",
      cantidad: "2",
      producto: null,
    });
    expect(linea).toMatchObject({ cantidad: 2, producto: null });

    const row = mapSolicitudCompraRow({
      id_solicitud_compra: "s-1",
      solicitud_compra_linea: null,
    } as unknown as SolicitudCompraDbRow);
    expect(row.lineas).toEqual([]);
  });
});
