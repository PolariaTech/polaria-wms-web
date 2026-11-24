import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustodioIngresoPageContent } from "./CustodioIngresoPageContent";
import { CustodioIngresoPageContentImpl } from "./CustodioIngresoPageContentImpl";

vi.mock("./useCustodioIngresoPage", () => ({
  useCustodioIngresoPage: () => ({
    codigoCuenta: "C1",
    activeBodegaId: null,
    ubicaciones: [],
    ordenes: [],
    isLoadingOrdenes: false,
    selectedOrdenId: "",
    setSelectedOrdenId: vi.fn(),
    ventas: [],
    isLoadingVentas: false,
    selectedSlot: null,
    setSelectedSlot: vi.fn(),
    isConnected: true,
    handleSelectSlot: vi.fn(),
    loadOrdenes: vi.fn(),
    loadVentas: vi.fn(),
    slotsIngresoCount: 0,
    resolveUbicacionIngreso: vi.fn(() => null),
    handleIngresoRegistrado: vi.fn(),
    handlePaqueteEnviado: vi.fn(),
    zonaIngreso: { slots: [] },
    zonaSalida: { slots: [] },
    cajasEnSalida: 0,
    isLoading: false,
    error: "boom",
  }),
}));
vi.mock("./CustodioOperacionTabs", () => ({
  CustodioOperacionTabs: () => <nav>tabs</nav>,
}));
vi.mock(
  "@/modules/warehouses/estado-bodega/components/EstadoBodegaSlotDetalleModal",
  () => ({ EstadoBodegaSlotDetalleModal: () => null }),
);

describe("CustodioIngresoPageContentImpl", () => {
  it("el barrel reexporta el componente", () => {
    expect(CustodioIngresoPageContent).toBe(CustodioIngresoPageContentImpl);
  });

  it("sin bodega activa muestra aviso, tabs y error", () => {
    render(<CustodioIngresoPageContentImpl />);

    expect(screen.getByText("Estado de bodega")).toBeInTheDocument();
    expect(screen.getByText("tabs")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    expect(
      screen.getByText(/Selecciona una bodega activa/),
    ).toBeInTheDocument();
    expect(screen.getByText(/En vivo/)).toBeInTheDocument();
  });
});
