import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustodioOrdenIngresoForm } from "./CustodioOrdenIngresoForm";
import { CustodioOrdenIngresoFormContent } from "./CustodioOrdenIngresoFormContent";

vi.mock("@/modules/admin-panel", () => ({
  listCatalogoProductosAdmin: vi.fn(async () => []),
}));
vi.mock("@/modules/purchases/shared/services/purchases-api.service", () => ({
  cerrarRecepcionCompraApi: vi.fn(),
}));
vi.mock("@/modules/purchases/shared/services/purchases.service", () => ({
  listOrdenCompraLineasRecepcion: vi.fn(async () => []),
}));

const ORDEN = {
  id_orden_compra: "oc-1",
  codigo: "OC-1",
  codigo_cuenta: "C1",
  id_bodega: "B1",
  fecha_entrega_estimada: null,
  lineas: [
    {
      id_linea_orden_compra: "l-1",
      id_producto: "p-1",
      cantidad: 10,
      cantidad_recibida: 0,
      producto: { sku: "S1", descripcion: "Pollo", metadatos_catalogo: null },
    },
  ],
} as never;

describe("CustodioOrdenIngresoFormContent", () => {
  it("el barrel reexporta el componente", () => {
    expect(CustodioOrdenIngresoForm).toBe(CustodioOrdenIngresoFormContent);
  });

  it("renderiza resumen, líneas y botón de registro", async () => {
    render(
      <CustodioOrdenIngresoFormContent
        orden={ORDEN}
        codigoCuenta="C1"
        resolveUbicacionIngreso={() => "U1"}
        slotsIngresoCount={1}
        onRegistered={() => undefined}
      />,
    );

    expect(screen.getByText(/OC-1/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("S1 Pollo")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Registrar ingreso y cerrar orden." }),
    ).toBeDisabled();
  });
});
