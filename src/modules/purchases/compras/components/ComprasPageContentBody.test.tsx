import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SolicitudCompraRow } from "../../shared/types/purchases.types";
import {
  ComprasPageContentBody,
  type ComprasPageContentBodyProps,
} from "./ComprasPageContentBody";

vi.mock("../../ordenes/components/OrdenCompraCreateModal", () => ({
  OrdenCompraCreateModal: () => null,
}));
vi.mock("../../ordenes/components/OrdenCompraDetalleModal", () => ({
  OrdenCompraDetalleModal: () => <div>detalle-orden</div>,
}));
vi.mock("../../solicitudes/components/SolicitudCompraCreateModal", () => ({
  SolicitudCompraCreateModal: () => null,
}));
vi.mock("../../solicitudes/components/SolicitudCompraDetalleModal", () => ({
  SolicitudCompraDetalleModal: () => <div>detalle-solicitud</div>,
}));
vi.mock("../../solicitudes/components/SolicitudProveedorPickerModal", () => ({
  SolicitudProveedorPickerModal: () => null,
}));

const query = {
  isLoading: false,
  isRefreshing: false,
  error: null,
  data: [],
  reload: vi.fn(async () => undefined),
};

const SOLICITUD = {
  id_solicitud_compra: "s-1",
  codigo: "SOL-1",
} as SolicitudCompraRow;

function buildProps(
  overrides: Partial<ComprasPageContentBodyProps> = {},
): ComprasPageContentBodyProps {
  return {
    activeTab: "solicitudes",
    setActiveTab: vi.fn(),
    actionError: null,
    actionSuccess: null,
    inspect: false,
    solicitudes: query,
    ordenes: query,
    solicitudesOrdenadas: [SOLICITUD],
    solicitudColumns: [
      { id: "codigo", header: "Solicitud", cell: (row) => row.codigo },
    ],
    ordenColumns: [],
    tenantError: null,
    isCreateOpen: false,
    setIsCreateOpen: vi.fn(),
    isOrdenCreateOpen: false,
    setIsOrdenCreateOpen: vi.fn(),
    solicitudDetalle: null,
    setSolicitudDetalle: vi.fn(),
    ordenDetalle: null,
    setOrdenDetalle: vi.fn(),
    renderSolicitudActions: () => null,
    renderOrdenActions: () => null,
    codigoCuenta: "CUENTA-01",
    notifiedOrdenIds: new Set(),
    handleDestinoChange: undefined,
    isSavingDestino: false,
    destinoError: null,
    pickingSolicitud: null,
    setPickingSolicitud: vi.fn(),
    proveedoresPicker: [],
    handleProveedorPicked: vi.fn(),
    setDestinoError: vi.fn(),
    ...overrides,
  };
}

describe("ComprasPageContentBody", () => {
  it("muestra tabla de solicitudes y cambia de pestaña", async () => {
    const props = buildProps();
    render(<ComprasPageContentBody {...props} />);

    expect(screen.getByText("Solicitudes de compra")).toBeInTheDocument();
    expect(screen.getByText("SOL-1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Órdenes" }));
    expect(props.setActiveTab).toHaveBeenCalledWith("ordenes");
  });

  it("muestra tabla de órdenes en la pestaña ordenes", () => {
    render(<ComprasPageContentBody {...buildProps({ activeTab: "ordenes" })} />);

    expect(screen.getByText("Órdenes de compra")).toBeInTheDocument();
    expect(screen.getByText(/Sin órdenes de compra/)).toBeInTheDocument();
  });

  it("muestra mensajes de acción y detalle de solicitud", () => {
    render(
      <ComprasPageContentBody
        {...buildProps({
          actionError: "fallo",
          actionSuccess: "listo",
          solicitudDetalle: SOLICITUD,
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("fallo");
    expect(screen.getByRole("status")).toHaveTextContent("listo");
    expect(screen.getByText("detalle-solicitud")).toBeInTheDocument();
  });
});
