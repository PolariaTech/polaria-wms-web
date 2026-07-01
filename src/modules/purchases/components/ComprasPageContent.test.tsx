import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/domain-service-error";
import type { OrdenCompraRow } from "../types/purchases.types";
import { ComprasPageContent } from "./ComprasPageContent";

const listSolicitudesCompra = vi.fn();
const listOrdenesCompra = vi.fn();
const listOrdenCompraLineas = vi.fn();
const notifyProveedorPedido = vi.fn();

vi.mock("../services/purchases.service", () => ({
  listSolicitudesCompra: (...args: unknown[]) => listSolicitudesCompra(...args),
  listOrdenesCompra: (...args: unknown[]) => listOrdenesCompra(...args),
  listOrdenCompraLineas: (...args: unknown[]) => listOrdenCompraLineas(...args),
}));

vi.mock("../services/purchases-api.service", () => ({
  aprobarSolicitudCompraApi: vi.fn(),
  convertirSolicitudCompraAOrdenApi: vi.fn(),
  createSolicitudCompraApi: vi.fn(),
  createOrdenCompraApi: vi.fn(),
  emitirOrdenCompraApi: vi.fn(),
  enviarSolicitudCompraAprobacionApi: vi.fn(),
}));

vi.mock("../services/pedido-proveedor-client.service", () => ({
  buildPedidoProveedorRequest: vi.fn((orden, lineas) => ({
    idOrdenCompra: orden.id_orden_compra,
    idProveedor: orden.id_proveedor,
    lineas,
  })),
  notifyProveedorPedido: (...args: unknown[]) => notifyProveedorPedido(...args),
}));

vi.mock("@/providers/CompanyProvider", () => ({
  useCompany: () => ({
    codigoCuenta: "CUENTA-01",
    activeBodegaId: "BOD-01",
  }),
}));

const ORDEN_EMITIDA: OrdenCompraRow = {
  id_orden_compra: "oc-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "BOD-01",
  id_proveedor: "prov-1",
  proveedor_nombre: "Pat-lafrieda",
  id_solicitud_compra: "sol-1",
  id_creador: "user-1",
  codigo: "OC-001",
  estado: "emitida",
  fecha_emision: "2026-06-28T12:00:00.000Z",
  fecha_entrega_estimada: null,
  destino_tipo: "bodega",
  observaciones: null,
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
  lineas: [
    {
      id_linea_orden_compra: "line-1",
      id_producto: "prod-1",
      cantidad: 66,
      producto: {
        sku: "BPTOMFRF",
        descripcion: "FROZEN-PRIME BEEF FRENCHED TOMAHAWK",
        metadatos_catalogo: null,
      },
    },
  ],
};

describe("ComprasPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSolicitudesCompra.mockResolvedValue([]);
    listOrdenesCompra.mockResolvedValue([ORDEN_EMITIDA]);
    listOrdenCompraLineas.mockResolvedValue([
      { sku: "SKU-001", cantidad: 5, unidad: "kg" },
    ]);
    notifyProveedorPedido.mockResolvedValue({
      ok: true,
      n8nStatus: 200,
      correlationId: "corr-12345678",
    });
  });

  it("notifica al proveedor en OC emitida", async () => {
    const user = userEvent.setup();

    render(<ComprasPageContent />);

    await user.click(screen.getByRole("button", { name: "Órdenes" }));

    await waitFor(() => {
      expect(screen.getByText("OC-001")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Ver detalle de orden OC-001" }),
    );

    expect(
      screen.getByRole("heading", { name: "OC-001" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      /FROZEN-PRIME BEEF FRENCHED TOMAHAWK/i,
    );

    await user.click(screen.getByRole("button", { name: "Notificar proveedor" }));

    await waitFor(() => {
      expect(listOrdenCompraLineas).toHaveBeenCalledWith("oc-1");
      expect(notifyProveedorPedido).toHaveBeenCalledWith({
        idOrdenCompra: "oc-1",
        idProveedor: "prov-1",
        lineas: [{ sku: "SKU-001", cantidad: 5, unidad: "kg" }],
      });
    });

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Proveedor notificado");
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Proveedor notificado.",
    );
  });

  it("muestra error claro si la integración n8n no está configurada", async () => {
    const user = userEvent.setup();

    notifyProveedorPedido.mockRejectedValue(
      new DomainServiceError(
        "Integración de pedido a proveedor no configurada.",
        "MUTATION_FAILED",
      ),
    );

    render(<ComprasPageContent />);

    await user.click(screen.getByRole("button", { name: "Órdenes" }));

    await waitFor(() => {
      expect(screen.getByText("OC-001")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Ver detalle de orden OC-001" }),
    );

    expect(
      screen.getByRole("heading", { name: "OC-001" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      /FROZEN-PRIME BEEF FRENCHED TOMAHAWK/i,
    );

    await user.click(screen.getByRole("button", { name: "Notificar proveedor" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Integración de pedido a proveedor no configurada.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText("Notificado")).not.toBeInTheDocument();
  });
});
