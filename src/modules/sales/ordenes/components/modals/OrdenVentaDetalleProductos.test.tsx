import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrdenVentaDetalleProductos } from "./OrdenVentaDetalleProductos";
import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";

const lineaBase = {
  id_linea_orden_venta: "l1",
  cantidad_pedida: 2,
  precio_unitario: 10,
  producto: { sku: "SKU-1", descripcion: "Producto demo" },
} as OrdenVentaLineaRow;

describe("OrdenVentaDetalleProductos", () => {
  it("muestra solo el conteo de productos sin unidad (REQ-224)", () => {
    render(
      <OrdenVentaDetalleProductos
        filas={[
          {
            linea: lineaBase,
            titulo: "Producto demo",
            especificacion: "",
            ivaPct: 0,
            importe: 20,
          },
        ]}
        hija={null}
        subtotal={20}
        iva={0}
        total={20}
        mostrarTotalOv={false}
        totalOv={20}
      />,
    );
    const conteo = screen.getByText("1 producto");
    expect(conteo).toBeInTheDocument();
    expect(conteo.textContent).not.toMatch(/kg|·/i);
  });

  it("no muestra Desc% ni Descuentos (REQ-218)", () => {
    render(
      <OrdenVentaDetalleProductos
        filas={[
          {
            linea: lineaBase,
            titulo: "Producto demo",
            especificacion: "fresa",
            ivaPct: 16,
            importe: 20,
          },
        ]}
        hija={null}
        subtotal={20}
        iva={3.2}
        total={23.2}
        mostrarTotalOv={false}
        totalOv={23.2}
      />,
    );
    expect(screen.queryByText("Desc%")).not.toBeInTheDocument();
    expect(screen.queryByText("Descuentos")).not.toBeInTheDocument();
  });
});
