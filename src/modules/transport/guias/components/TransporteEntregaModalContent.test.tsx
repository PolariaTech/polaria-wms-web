import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransporteEntregaModal } from "./TransporteEntregaModal";
import { TransporteEntregaModalContent } from "./TransporteEntregaModalContent";

vi.mock("@/modules/sales", () => ({
  getOrdenVentaDetalle: vi.fn(async () => ({
    lineas: [
      {
        id_linea_orden_venta: "l-1",
        cantidad_pedida: 5,
        producto: { sku: "S1", descripcion: "Pollo" },
      },
    ],
  })),
}));
vi.mock("../../shared/services/transport-api.service", () => ({
  registrarEntregaApi: vi.fn(),
  uploadEvidenciaTransporteApi: vi.fn(),
}));

const VIAJE = {
  idViaje: "v-1",
  idGuia: "g-1",
  idOrdenVenta: "ov-1",
  codigoViaje: "VJ-1",
  codigoVenta: "V-1",
  clienteNombre: "Cliente",
} as never;

describe("TransporteEntregaModalContent", () => {
  it("el barrel reexporta el componente", () => {
    expect(TransporteEntregaModal).toBe(TransporteEntregaModalContent);
  });

  it("muestra título, paso 1 y productos; avanza al paso 2", async () => {
    render(
      <TransporteEntregaModalContent
        open
        viaje={VIAJE}
        codigoCuenta="C1"
        idBodega="B1"
        onClose={() => undefined}
        onEntregado={() => undefined}
      />,
    );

    expect(screen.getByText("Entrega · VJ-1")).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 4")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("S1 Pollo")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByText("Paso 2 de 4")).toBeInTheDocument();
    expect(screen.getByText(/Evidencia de la entrega/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeInTheDocument();
  });
});
