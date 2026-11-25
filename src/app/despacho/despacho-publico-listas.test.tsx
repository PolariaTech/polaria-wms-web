import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PantallaOrdenes } from "./despacho-publico-listas";
import type { FlujoDespacho } from "./despacho-publico-flujo";
import type { OrdenDespachoPublico } from "@/modules/sales/ordenes/despacho/despacho-publico";

const orden: OrdenDespachoPublico = {
  idOrdenVenta: "ov-1",
  codigo: "OV-1",
  estado: "alistada",
  codigoCuenta: "023WA",
  nombreCliente: "Krystal Cancún",
  denominacionComercial: "Krystal",
  cantidadOrdenesTrabajo: 2,
  ordenCompraCliente: "OC-77",
};

function flujoVacio(): FlujoDespacho {
  return {
    seleccion: null,
    defecto: "Ana",
    despachador: "Ana",
    transportista: "",
    enviando: false,
    confirmando: false,
    preguntarDefault: false,
    error: null,
    setDespachador: vi.fn(),
    setTransportista: vi.fn(),
    abrir: vi.fn(),
    cerrar: vi.fn(),
    pasar: vi.fn(),
    volver: vi.fn(),
    usarNuevo: vi.fn(),
    dejarAnterior: vi.fn(),
    guardar: vi.fn(),
    confirmar: vi.fn(),
  };
}

describe("PantallaOrdenes", () => {
  it("muestra denominación, OT y orden de compra", () => {
    render(
      <PantallaOrdenes
        alistada={[orden]}
        alistamiento={[]}
        errorCarga={null}
        flujo={flujoVacio()}
      />,
    );
    expect(screen.getByText("Krystal · 2 OT · OC OC-77")).toBeInTheDocument();
    expect(screen.getByText("No hay órdenes en alistamiento.")).toBeInTheDocument();
  });
});
