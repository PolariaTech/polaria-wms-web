import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SolicitudCompraRow } from "../../shared/types/purchases.types";
import { SolicitudCompraDetalleModal } from "../../solicitudes/components/SolicitudCompraDetalleModal";

const SOLICITUD: SolicitudCompraRow = {
  id_solicitud_compra: "sol-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "BOD-01",
  id_proveedor: null,
  id_orden_compra: null,
  codigo: "SOL-0001",
  estado: "borrador",
  id_solicitante: "usr-1",
  observaciones: "Entrega urgente",
  created_at: "2026-06-30T12:00:00.000Z",
  updated_at: "2026-06-30T12:00:00.000Z",
  lineas: [
    {
      id_linea_solicitud_compra: "line-1",
      id_producto: "prod-1",
      cantidad: 60,
      producto: {
        sku: "T92EQ",
        descripcion: "FROZEN-WHOLE CHICKEN",
        codigo_almacen: null,
        metadatos_catalogo: null,
      },
    },
  ],
};

describe("SolicitudCompraDetalleModal", () => {
  it("muestra resumen y productos completos", () => {
    render(
      <SolicitudCompraDetalleModal
        solicitud={SOLICITUD}
        onClose={() => undefined}
        actions={<button type="button">Enviar aprobación</button>}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByText(/FROZEN-WHOLE CHICKEN/i)).toBeInTheDocument();
    expect(screen.getByText("Entrega urgente")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar aprobación" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });
});
