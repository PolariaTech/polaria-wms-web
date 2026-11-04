import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OperadorOrdenesVentaPageContent } from "./OperadorOrdenesVentaPageContent";

const listOrdenesVentaOperador = vi.fn();

vi.mock("@/modules/sales/shared/services/sales.service", () => ({
  listOrdenesVentaOperador: (...args: unknown[]) =>
    listOrdenesVentaOperador(...args),
  listProductosVentaCatalogo: vi.fn().mockResolvedValue([]),
  getOrdenVentaDetalle: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/modules/sales/shared/hooks/useOrdenesVentaSubscription", () => ({
  useOrdenesVentaSubscription: () => undefined,
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({
    codigoCuenta: "CUENTA-01",
    activeBodegaId: "bod-1",
  }),
}));

vi.mock("@/hooks/shared/useShellOverlayStore", () => ({
  useShellOverlayStore: (
    selector: (s: {
      setCypherOpen: () => void;
      setOvEditOpen: () => void;
    }) => unknown,
  ) =>
    selector({
      setCypherOpen: vi.fn(),
      setOvEditOpen: vi.fn(),
    }),
}));

vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("../modals/OrdenVentaCreateModal", () => ({
  OrdenVentaCreateModal: () => null,
}));

vi.mock("../modals/OrdenVentaDetalleModal", () => ({
  OrdenVentaDetalleModal: () => null,
}));

vi.mock("../modals/OrdenVentaCypherDrawer", () => ({
  OrdenVentaCypherDrawer: () => null,
}));

describe("OperadorOrdenesVentaPageContent (REQ-226)", () => {
  beforeEach(() => {
    listOrdenesVentaOperador.mockReset();
    listOrdenesVentaOperador.mockResolvedValue([]);
  });

  it("muestra el H1 «Órdenes venta» y oculta subtítulo y título de tarjeta", async () => {
    render(<OperadorOrdenesVentaPageContent />);

    expect(
      screen.getByRole("heading", { name: "Órdenes venta" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Órdenes de venta manuales de la cuenta."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Órdenes de venta" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Venta, cliente y estado."),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(listOrdenesVentaOperador).toHaveBeenCalled();
    });
  });
});
