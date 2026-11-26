import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CypherMoverAdjuntosPanel } from "./CypherMoverAdjuntosPanel";

const moverMock = vi.fn();

vi.mock("../../services/mover-adjunto-ov.client", () => ({
  moverAdjuntoOrdenVenta: (...args: unknown[]) => moverMock(...args),
}));

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const ADJUNTOS = [{ nombre: "OC-140188.pdf", path: "cuenta/uuid-OC-140188.pdf" }];
const HERMANAS = [
  { idOrdenVenta: ID_A, codigo: "OV-0001", ordenCompra: "140182" },
  { idOrdenVenta: ID_B, codigo: "OV-0002", ordenCompra: "140188" },
];

describe("CypherMoverAdjuntosPanel (REQ-361)", () => {
  beforeEach(() => {
    moverMock.mockReset();
  });

  it("no se muestra si no hay hermanas reales con UUID", () => {
    const { container } = render(
      <CypherMoverAdjuntosPanel
        idOrdenVenta={ID_A}
        adjuntos={ADJUNTOS}
        hermanas={[{ idOrdenVenta: "listado-OV-0002", codigo: "OV-0002", ordenCompra: null }]}
        onAdjuntoMovido={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("permite mover un adjunto a otra OV hermana y notifica onAdjuntoMovido", async () => {
    moverMock.mockResolvedValue({
      idOrdenVentaOrigen: ID_A,
      idOrdenVentaDestino: ID_B,
      path: ADJUNTOS[0]!.path,
    });
    const onMovido = vi.fn();

    render(
      <CypherMoverAdjuntosPanel
        idOrdenVenta={ID_A}
        adjuntos={ADJUNTOS}
        hermanas={HERMANAS}
        onAdjuntoMovido={onMovido}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mover" }));

    await waitFor(() => {
      expect(moverMock).toHaveBeenCalledWith({
        idOrdenVenta: ID_A,
        idOrdenVentaDestino: ID_B,
        path: "cuenta/uuid-OC-140188.pdf",
      });
    });
    expect(onMovido).toHaveBeenCalledWith("cuenta/uuid-OC-140188.pdf");
    expect(screen.getByRole("status").textContent).toContain("OV-0002");
  });

  it("muestra el error si el servidor rechaza el movimiento", async () => {
    moverMock.mockRejectedValue(new Error("Las dos órdenes de venta no vienen del mismo correo."));

    render(
      <CypherMoverAdjuntosPanel
        idOrdenVenta={ID_A}
        adjuntos={ADJUNTOS}
        hermanas={HERMANAS}
        onAdjuntoMovido={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mover" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("no vienen del mismo correo");
    });
  });
});
