import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatosOrden } from "./despacho-publico-ui";
import type { OrdenDespachoPublico } from "@/modules/sales/ordenes/despacho/despacho-publico";

const orden: OrdenDespachoPublico = {
  idOrdenVenta: "ov-1",
  codigo: "OV-1",
  estado: "alistada",
  codigoCuenta: "023WA",
  nombreCliente: "Krystal",
  denominacionComercial: "Krystal Resort",
  cantidadOrdenesTrabajo: 3,
  ordenCompraCliente: "OC-9",
};

describe("DatosOrden", () => {
  it("muestra denominación, cantidad de OT y orden de compra", () => {
    render(<DatosOrden orden={orden} />);
    expect(screen.getByText("Krystal Resort · 3 OT · OC OC-9")).toBeInTheDocument();
  });
});
