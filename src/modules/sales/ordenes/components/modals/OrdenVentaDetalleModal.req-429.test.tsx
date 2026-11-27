import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { OrdenVentaDetalleModal } from "./OrdenVentaDetalleModal";

const datos = vi.hoisted(() => ({ orden: null as unknown }));

vi.mock("../../hooks/use-orden-venta-detalle-data", () => ({
  useOrdenVentaDetalleData: () => ({
    orden: datos.orden,
    setOrden: vi.fn(),
    isLoading: false,
    error: null,
    actionError: null,
    setActionError: vi.fn(),
    reloadDetalle: vi.fn(),
  }),
}));
vi.mock("../../hooks/use-emitir-orden-venta-detalle", () => ({
  useEmitirOrdenVentaDetalle: () => ({ isEmitting: false, handleEmitir: vi.fn() }),
}));
vi.mock("./OrdenVentaDetalleContent", () => ({
  OrdenVentaDetalleContent: (p: { hija: OrdenTrabajoHija | null }) => (
    <div data-testid="contenido">{p.hija ? `ot:${p.hija.almacen}` : "sin-ot"}</div>
  ),
}));

function ordenConOrigen(origenCorreo: unknown): OrdenVentaDetalleRow {
  return {
    id_orden_venta: "ov-1",
    codigo: "OV-00002884",
    estado: "confirmada",
    comprador_nombre: "EL DELI",
    observaciones: null,
    origen_correo: origenCorreo,
    lineas: [],
  } as unknown as OrdenVentaDetalleRow;
}

const renglonOt = {
  Almacen: "EL DELI PTO CANCUN",
  "Numero pedido": "ADP-261125-1902-R0Q",
  Producto: "JITOMATE GUAJE",
  Cantidad: 5,
};

describe("OrdenVentaDetalleModal (REQ-429)", () => {
  it("con origen_correo como arreglo (jsonb) el detalle recibe la OT activa", () => {
    datos.orden = ordenConOrigen([renglonOt]);
    render(
      <OrdenVentaDetalleModal idOrdenVenta="ov-1" codigoCuenta="C-1" onClose={vi.fn()} />,
    );
    expect(screen.getByTestId("contenido")).toHaveTextContent("ot:EL DELI PTO CANCUN");
    expect(screen.getByText("1 orden de trabajo")).toBeInTheDocument();
  });

  it("con origen_correo como texto JSON sigue funcionando", () => {
    datos.orden = ordenConOrigen(JSON.stringify([renglonOt]));
    render(
      <OrdenVentaDetalleModal idOrdenVenta="ov-1" codigoCuenta="C-1" onClose={vi.fn()} />,
    );
    expect(screen.getByTestId("contenido")).toHaveTextContent("ot:EL DELI PTO CANCUN");
  });
});
