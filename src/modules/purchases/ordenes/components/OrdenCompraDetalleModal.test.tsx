import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import { OrdenCompraDetalleModal } from "../../ordenes/components/OrdenCompraDetalleModal";

const listBodegasDestinoCompraApi = vi.fn();

vi.mock("../../shared/services/purchases-api.service", () => ({
  listBodegasDestinoCompraApi: (...args: unknown[]) =>
    listBodegasDestinoCompraApi(...args),
}));

const ORDEN_BORRADOR: OrdenCompraRow = {
  id_orden_compra: "oc-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "BOD-01",
  id_proveedor: "prov-1",
  proveedor_nombre: "Pat lafrida",
  id_solicitud_compra: null,
  id_creador: null,
  codigo: "OC-000001",
  estado: "borrador",
  fecha_emision: "2026-06-30T12:00:00.000Z",
  fecha_entrega_estimada: "2026-06-30T12:00:00.000Z",
  destino_tipo: "interna",
  observaciones: null,
  created_at: "2026-06-30T12:00:00.000Z",
  updated_at: "2026-06-30T12:00:00.000Z",
  lineas: [
    {
      id_linea_orden_compra: "line-1",
      id_producto: "prod-1",
      cantidad: 60,
      producto: {
        sku: "T92EQ",
        descripcion: "FROZEN-WHOLE CHICKEN",
        metadatos_catalogo: null,
      },
    },
  ],
};

const ORDEN_EMITIDA: OrdenCompraRow = {
  ...ORDEN_BORRADOR,
  estado: "emitida",
};

describe("OrdenCompraDetalleModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBodegasDestinoCompraApi.mockResolvedValue([
      {
        idBodega: "BOD-01",
        codigoCuenta: "CUENTA-01",
        codigo: "BOD-CENTRAL",
        nombre: "Bodega Central",
        tipo: "interna",
        capacidadSlots: 50,
        slotsLibres: 12,
      },
    ]);
  });

  it("muestra resumen, destino y productos sin icono", async () => {
    render(
      <OrdenCompraDetalleModal
        orden={ORDEN_EMITIDA}
        codigoCuenta="CUENTA-01"
        onClose={() => undefined}
        actions={<button type="button">Emitir orden</button>}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByLabelText(/carrito/i)).not.toBeInTheDocument();
    expect(screen.getByText("Pat lafrida")).toBeInTheDocument();
    expect(screen.getByText("Bodega interna")).toBeInTheDocument();
    expect(screen.getByText(/FROZEN-WHOLE CHICKEN/i)).toBeInTheDocument();
    expect(screen.getByText(/60/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Cerrar" })).toHaveLength(1);

    await waitFor(() => {
      expect(screen.getByText(/Bodega Central/i)).toBeInTheDocument();
    });
  });

  it("permite elegir destino interna o externa en borrador", async () => {
    const user = userEvent.setup();
    const onDestinoChange = vi.fn();

    render(
      <OrdenCompraDetalleModal
        orden={ORDEN_BORRADOR}
        codigoCuenta="CUENTA-01"
        onClose={() => undefined}
        onDestinoChange={onDestinoChange}
      />,
    );

    await waitFor(() => {
      expect(listBodegasDestinoCompraApi).toHaveBeenCalledWith({
        codigoCuenta: "CUENTA-01",
        tipo: "interna",
      });
    });

    await user.selectOptions(
      screen.getByLabelText("Tipo"),
      screen.getByRole("option", { name: "Bodega externa" }),
    );

    expect(onDestinoChange).toHaveBeenCalledWith({
      destinoTipo: "externa",
      idBodega: "",
    });
  });

  it("permite elegir bodega destino con slots libres", async () => {
    const user = userEvent.setup();
    const onDestinoChange = vi.fn();

    render(
      <OrdenCompraDetalleModal
        orden={{ ...ORDEN_BORRADOR, id_bodega: "" }}
        codigoCuenta="CUENTA-01"
        onClose={() => undefined}
        onDestinoChange={onDestinoChange}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /Bodega Central · 12 slots libres/i }),
      ).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText("Bodega destino"),
      screen.getByRole("option", { name: /Bodega Central · 12 slots libres/i }),
    );

    expect(onDestinoChange).toHaveBeenCalledWith({ idBodega: "BOD-01" });
  });

  it("permite cambiar la fecha de llegada en borrador", async () => {
    const user = userEvent.setup();
    const onDestinoChange = vi.fn();

    render(
      <OrdenCompraDetalleModal
        orden={ORDEN_BORRADOR}
        codigoCuenta="CUENTA-01"
        onClose={() => undefined}
        onDestinoChange={onDestinoChange}
      />,
    );

    const fechaInput = screen.getByLabelText("Llegada estimada");
    expect(fechaInput).toHaveAttribute("type", "date");
    await user.clear(fechaInput);
    await user.type(fechaInput, "2026-07-10");

    expect(onDestinoChange).toHaveBeenCalledWith({
      fechaEntregaEstimada: "2026-07-10",
    });
  });
});
