import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { OrdenVentaDetalleModal } from "./OrdenVentaDetalleModal";

const estado = vi.hoisted(() => ({ orden: null as unknown }));

vi.mock("../../hooks/use-orden-venta-detalle-data", () => ({
  useOrdenVentaDetalleData: () => ({
    orden: estado.orden,
    setOrden: vi.fn(),
    isLoading: false,
    error: null,
    actionError: null,
    setActionError: vi.fn(),
    reloadDetalle: vi.fn(),
  }),
}));

vi.mock("../../hooks/use-emitir-orden-venta-detalle", () => ({
  useEmitirOrdenVentaDetalle: () => ({
    isEmitting: false,
    handleEmitir: vi.fn(),
  }),
}));

vi.mock("./OrdenVentaDetalleContent", () => ({
  OrdenVentaDetalleContent: ({
    hija,
  }: {
    hija: { id: string } | null;
  }) => <div data-testid="ot-activa">{hija ? hija.id : "sin-ot"}</div>,
}));

const renglon = (almacen: string, pedido: string, cantidad: number) => ({
  Almacen: almacen,
  "Numero pedido": pedido,
  Producto: `P-${pedido}`,
  Cantidad: cantidad,
});

const origenLista = [renglon("A", "1", 5), renglon("B", "2", 7)];

function armarOrden(origenCorreo: unknown): OrdenVentaDetalleRow {
  return {
    id_orden_venta: "ov-1",
    codigo: "OV-00001",
    estado: "confirmada",
    origen_correo: origenCorreo,
    lineas: [],
  } as unknown as OrdenVentaDetalleRow;
}

function renderModal() {
  return render(
    <OrdenVentaDetalleModal
      idOrdenVenta="ov-1"
      codigoCuenta="cuenta-1"
      onClose={vi.fn()}
    />,
  );
}

describe("OrdenVentaDetalleModal con varias órdenes de trabajo", () => {
  beforeEach(() => {
    estado.orden = null;
  });

  it("con origen_correo como lista muestra la OT 1 de 2 y el paginador", () => {
    estado.orden = armarOrden(origenLista);
    renderModal();

    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(screen.getByTestId("ot-activa")).toHaveTextContent("almacen:a");
  });

  it("Siguiente pasa a la OT 2 de 2 y el contenido recibe esa OT", async () => {
    const user = userEvent.setup();
    estado.orden = armarOrden(origenLista);
    renderModal();

    await user.click(screen.getByRole("button", { name: /Siguiente/ }));

    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    expect(screen.getByTestId("ot-activa")).toHaveTextContent("almacen:b");
  });

  it("acepta origen_correo como texto JSON (formato anterior)", () => {
    estado.orden = armarOrden(JSON.stringify(origenLista));
    renderModal();

    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(screen.getByTestId("ot-activa")).toHaveTextContent("almacen:a");
  });

  it("sin origen_correo no muestra paginador y el contenido no tiene OT", () => {
    estado.orden = armarOrden(null);
    renderModal();

    expect(screen.queryByText(/ de 2/)).not.toBeInTheDocument();
    expect(screen.getByTestId("ot-activa")).toHaveTextContent("sin-ot");
  });
});
