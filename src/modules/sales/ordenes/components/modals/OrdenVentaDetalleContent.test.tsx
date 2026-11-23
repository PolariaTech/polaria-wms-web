import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { OrdenVentaDetalleContent } from "./OrdenVentaDetalleContent";

vi.mock("../../hooks/use-folio-factura-detalle", () => ({
  useFolioFacturaDetalle: () => "FAC-9",
}));
vi.mock("./OrdenVentaDetalleDatosPedidoEntrega", () => ({
  OrdenVentaDetalleDatosPedidoEntrega: (p: {
    clienteNombre: string;
    folioFactura: string;
  }) => (
    <div data-testid="datos">
      {p.clienteNombre}|{p.folioFactura}
    </div>
  ),
}));
vi.mock("./OrdenVentaDetalleProductos", () => ({
  OrdenVentaDetalleProductos: (p: { filas: unknown[]; total: number }) => (
    <div data-testid="productos">
      {p.filas.length} filas · total {p.total}
    </div>
  ),
}));

const base = {
  id_orden_venta: "ov-1",
  codigo: "OV-1",
  estado: "por_confirmar",
  comprador_nombre: "HOTEL SOL",
  observaciones: null,
  origen_correo: null,
  lineas: [],
} as unknown as OrdenVentaDetalleRow;

function renderContenido(orden: OrdenVentaDetalleRow) {
  return render(
    <OrdenVentaDetalleContent
      orden={orden}
      codigoCuenta="C-1"
      idOrdenVenta="ov-1"
      mostrarTotalOv={false}
    />,
  );
}

describe("OrdenVentaDetalleContent", () => {
  it("sin líneas ni correo muestra «Sin líneas registradas.»", () => {
    renderContenido(base);
    expect(screen.getByText("Sin líneas registradas.")).toBeInTheDocument();
    expect(screen.queryByTestId("productos")).toBeNull();
  });

  it("pasa el cliente y el folio de factura a datos del pedido", () => {
    renderContenido(base);
    expect(screen.getByTestId("datos").textContent).toContain("|FAC-9");
  });

  it("con líneas de catálogo pinta la tabla de productos con los montos", () => {
    renderContenido({
      ...base,
      lineas: [
        {
          id_linea_orden_venta: "l1",
          id_producto: "p1",
          cantidad_pedida: 2,
          precio_unitario: 10,
          producto: { sku: "P1", descripcion: "PAPAYA" },
        },
      ],
    } as unknown as OrdenVentaDetalleRow);
    expect(screen.getByTestId("productos")).toHaveTextContent("1 filas · total 20");
  });

  it("sin líneas pero con renglones del correo muestra el respaldo del origen", () => {
    renderContenido({
      ...base,
      origen_correo: JSON.stringify([
        { Producto: "MANGO", Cantidad: 4, Precio: 3 },
      ]),
    } as unknown as OrdenVentaDetalleRow);
    expect(screen.getByText("MANGO")).toBeInTheDocument();
    expect(screen.getByText(/aún sin ligar al catálogo/)).toBeInTheDocument();
  });
});
