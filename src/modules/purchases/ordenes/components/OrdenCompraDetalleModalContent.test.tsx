import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import { OrdenCompraDetalleModalContent } from "./OrdenCompraDetalleModalContent";

vi.mock("../../shared/services/purchases-api.service", () => ({
  listBodegasDestinoCompraApi: vi.fn(async () => []),
}));

const ORDEN = {
  id_orden_compra: "oc-1",
  codigo: "OC-9",
  estado: "emitida",
  proveedor_nombre: "ACME",
  id_bodega: "abcdefghijk",
  fecha_emision: "2026-06-30T12:00:00.000Z",
  fecha_entrega_estimada: null,
  destino_tipo: "interna",
  observaciones: null,
  lineas: [],
} as unknown as OrdenCompraRow;

describe("OrdenCompraDetalleModalContent", () => {
  it("no renderiza nada sin orden", () => {
    const { container } = render(
      <OrdenCompraDetalleModalContent orden={null} onClose={() => undefined} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra código, proveedor y bodega abreviada", () => {
    render(
      <OrdenCompraDetalleModalContent
        orden={ORDEN}
        notified
        onClose={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "OC-9" })).toBeInTheDocument();
    expect(screen.getByText("ACME")).toBeInTheDocument();
    expect(screen.getByText("abcdefgh")).toBeInTheDocument();
    expect(screen.getByText("Sin líneas registradas.")).toBeInTheDocument();
    expect(screen.getByText("Proveedor notificado.")).toBeInTheDocument();
  });
});
