import { describe, expect, it } from "vitest";
import { resolveSkuVisible } from "./resolve-sku-visible";
import type { OrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";

describe("resolveSkuVisible", () => {
  it("usa el código del origen cuando el sku está archivado", () => {
    const hija: OrdenTrabajoHija = {
      id: "ot-jalisco",
      label: "Jalisco",
      numeroPedido: "450",
      almacen: "Ayb Xc Restaurant Jalisco",
      referenciaPedido: "",
      fecha: "",
      responsableExterno: "",
      totalCantidad: 0.25,
      renglones: [
        {
          Producto: "BLUE BERRY",
          "Codigo producto": "X200062800",
          Cantidad: 0.25,
          Almacen: "Ayb Xc Restaurant Jalisco",
        },
      ],
    };

    const sku = resolveSkuVisible({
      linea: {
        id_linea_orden_venta: "l1",
        id_producto: "p1",
        cantidad_pedida: 0.25,
        precio_unitario: 330,
        producto: {
          sku: "ARCH-b61ee2fa39bb4634b63a3a1b279721b0",
          descripcion: "BLUE BERRY",
          metadatos_catalogo: null,
        },
      },
      hija,
    });

    expect(sku).toBe("X200062800");
  });

  it("respeta un sku usable del catálogo", () => {
    expect(
      resolveSkuVisible({
        linea: {
          id_linea_orden_venta: "l1",
          id_producto: "p1",
          cantidad_pedida: 1,
          precio_unitario: 10,
          producto: {
            sku: "X200062800",
            descripcion: "BLUE BERRY",
            metadatos_catalogo: null,
          },
        },
      }),
    ).toBe("X200062800");
  });
});
