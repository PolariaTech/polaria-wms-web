import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustodioOrdenSalidaColumn } from "./CustodioOrdenSalidaColumn";
import { CustodioOrdenSalidaColumnContent } from "./CustodioOrdenSalidaColumnContent";

vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("@/modules/admin-panel/camiones/services/camiones.service", () => ({
  formatCamionId: (id: string) => id,
  listCamionesAdmin: vi.fn(async () => []),
}));
vi.mock("@/modules/sales", () => ({
  getOrdenVentaDetalle: vi.fn(async () => ({ lineas: [] })),
}));
vi.mock("@/modules/transport", () => ({
  crearPaqueteDespachoApi: vi.fn(),
}));

const VENTAS = [
  {
    idOrdenVenta: "ov-1",
    venta: "V-1",
    comprador: "A",
    cuenta: "C1",
    estado: "confirmada",
  },
] as never;

function renderColumn(onRefresh = vi.fn()) {
  render(
    <CustodioOrdenSalidaColumnContent
      ventas={VENTAS}
      cajasEnSalida={4}
      codigoCuenta="C1"
      idBodega="B1"
      onRefresh={onRefresh}
      isLoading={false}
      slotSize={40}
    />,
  );
  return onRefresh;
}

describe("CustodioOrdenSalidaColumnContent", () => {
  it("el barrel reexporta el componente", () => {
    expect(CustodioOrdenSalidaColumn).toBe(CustodioOrdenSalidaColumnContent);
  });

  it("muestra cabecera con conteos y panel de armado", async () => {
    renderColumn();

    expect(screen.getByText("Orden de salida")).toBeInTheDocument();
    expect(screen.getByText("4 cajas")).toBeInTheDocument();
    expect(screen.getByText("1 ventas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previsualizar" }),
    ).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByText("Paquete de despacho")).toBeInTheDocument(),
    );
  });

  it("Actualizar invoca onRefresh", async () => {
    const onRefresh = renderColumn();

    await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(onRefresh).toHaveBeenCalled();
  });
});
