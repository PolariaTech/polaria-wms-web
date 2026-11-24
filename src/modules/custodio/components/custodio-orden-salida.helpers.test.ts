import { describe, expect, it } from "vitest";
import {
  buildPreviewRows,
  ESTADOS_VENTA_ACTIVA,
  lineaProductoLabel,
  primaryButtonClass,
  secondaryButtonClass,
  truckLabel,
} from "./custodio-orden-salida.helpers";

describe("custodio-orden-salida.helpers", () => {
  it("truckLabel usa código o id formateado", () => {
    expect(
      truckLabel({ placa: "ABC123", codigo: " CAM-1 ", idCamion: "x" } as never),
    ).toBe("ABC123 · CAM-1");
    expect(
      truckLabel({ placa: "ABC123", codigo: null, idCamion: "x" } as never),
    ).toMatch(/^ABC123 · .+/);
  });

  it("lineaProductoLabel combina sku y descripción con fallbacks", () => {
    const make = (sku?: string, descripcion?: string) =>
      ({ producto: { sku, descripcion } }) as never;

    expect(lineaProductoLabel(make("S1", "Pollo"))).toBe("S1 Pollo");
    expect(lineaProductoLabel(make("S1", undefined))).toBe("S1");
    expect(lineaProductoLabel(make(undefined, "Pollo"))).toBe("Pollo");
    expect(lineaProductoLabel({ producto: null } as never)).toBe("Producto");
  });

  it("incluye los estados activos y clases de botón", () => {
    expect(ESTADOS_VENTA_ACTIVA).toContain("confirmada");
    expect(ESTADOS_VENTA_ACTIVA).not.toContain("borrador");
    expect(primaryButtonClass).toContain("bg-polaria-teal");
    expect(secondaryButtonClass).toContain("border-polaria-t-20");
  });

  it("buildPreviewRows genera filas por línea y fila vacía", () => {
    const ventasActivas = [
      { idOrdenVenta: "ov-1", venta: "V-1", comprador: "Comp" },
    ] as never;
    const previewByOrden = {
      "ov-1": {
        codigo: "V-1",
        lineas: [
          {
            id_linea_orden_venta: "l-1",
            cantidad_pedida: 4,
            producto: { sku: "S1", descripcion: "Pollo" },
          },
        ],
      },
    } as never;

    expect(
      buildPreviewRows({
        previewIds: ["ov-1"],
        previewByOrden,
        ventasActivas,
        loadingPreview: false,
      }),
    ).toEqual([
      {
        key: "l-1",
        venta: "V-1",
        comprador: "Comp",
        producto: "S1 Pollo",
        cantidadKg: 4,
      },
    ]);

    const vacio = buildPreviewRows({
      previewIds: ["ov-2"],
      previewByOrden: {},
      ventasActivas: [],
      loadingPreview: false,
    });
    expect(vacio).toEqual([
      {
        key: "ov-2-empty",
        venta: "ov-2",
        comprador: "—",
        producto: "Sin líneas",
        cantidadKg: 0,
      },
    ]);

    expect(
      buildPreviewRows({
        previewIds: ["ov-2"],
        previewByOrden: {},
        ventasActivas: [],
        loadingPreview: true,
      }),
    ).toEqual([]);
  });
});
