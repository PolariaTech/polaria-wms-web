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
  OrdenVentaDetalleProductos: (p: {
    filas: unknown[];
    total: number;
    avisoTotal?: { db: string } | null;
  }) => (
    <div data-testid="productos">
      {p.filas.length} filas · total {p.total}
      {p.avisoTotal ? ` · aviso ${p.avisoTotal.db}` : ""}
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

  describe("alerta de total OV vs OC (REQ-371)", () => {
    const conLineas = (origenTexto: string | null) =>
      ({
        ...base,
        origen_texto: origenTexto,
        lineas: [
          {
            id_linea_orden_venta: "l1",
            id_producto: "p1",
            cantidad_pedida: 2,
            precio_unitario: 10,
            producto: { sku: "P1", descripcion: "PAPAYA" },
          },
        ],
      }) as unknown as OrdenVentaDetalleRow;

    it("si el total de la OC no cuadra con el de la OV, pasa el aviso a productos", () => {
      renderContenido(conLineas("Pedido\nTotal pedido: MXN 99.00"));
      expect(screen.getByTestId("productos")).toHaveTextContent("aviso Solicitud $99.00");
    });

    it("si el total de la OC cuadra con el de la OV, no hay aviso", () => {
      renderContenido(conLineas("Pedido\nTotal pedido: MXN 20.00"));
      expect(screen.getByTestId("productos")).not.toHaveTextContent("aviso");
    });

    it("si el texto de origen no trae total, no hay aviso", () => {
      renderContenido(conLineas("Favor de surtir mañana"));
      expect(screen.getByTestId("productos")).not.toHaveTextContent("aviso");
    });
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
