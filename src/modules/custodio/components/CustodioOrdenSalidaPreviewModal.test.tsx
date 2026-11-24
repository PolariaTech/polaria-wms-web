import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustodioOrdenSalidaPreviewModal } from "./CustodioOrdenSalidaPreviewModal";

describe("CustodioOrdenSalidaPreviewModal", () => {
  it("muestra estado de carga", () => {
    render(
      <CustodioOrdenSalidaPreviewModal
        open
        onClose={() => undefined}
        loading
        rows={[]}
      />,
    );
    expect(screen.getByText("Cargando productos…")).toBeInTheDocument();
  });

  it("muestra mensaje vacío sin filas", () => {
    render(
      <CustodioOrdenSalidaPreviewModal
        open
        onClose={() => undefined}
        loading={false}
        rows={[]}
      />,
    );
    expect(screen.getByText("No hay productos para previsualizar.")).toBeInTheDocument();
  });

  it("renderiza la tabla de productos", () => {
    render(
      <CustodioOrdenSalidaPreviewModal
        open
        onClose={() => undefined}
        loading={false}
        rows={[
          {
            key: "k1",
            venta: "V-1",
            comprador: "Comp",
            producto: "S1 Pollo",
            cantidadKg: 5,
          },
        ]}
      />,
    );
    expect(screen.getByText("V-1")).toBeInTheDocument();
    expect(screen.getByText("S1 Pollo")).toBeInTheDocument();
    expect(screen.getByText(/kg$/)).toBeInTheDocument();
  });
});
