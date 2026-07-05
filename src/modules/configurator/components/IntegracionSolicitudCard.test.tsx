import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IntegracionSolicitudCard } from "./IntegracionSolicitudCard";

const baseRow = {
  idSolicitudIntegracion: "sol-1",
  codigoCuenta: "MIT00",
  cuentaNombre: "Mit",
  bodegaExternaId: "bod-1",
  bodegaNombre: "Fridem",
  tipoIntegracion: "scraping" as const,
  estado: "activo",
  createdAt: "2026-07-01T20:04:00.000Z",
  solicitanteCorreo: "operadormit@operadormit.com",
  solicitanteNombre: "Operador Mit",
};

describe("IntegracionSolicitudCard", () => {
  it("renderiza el flujo cuenta → bodega externa con metadatos", () => {
    render(<IntegracionSolicitudCard row={baseRow} />);

    expect(
      screen.getByText(
        "Solicitud de integración · tocá para ejecutar y cerrar (queda Finalizado en la cuenta)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Cuenta")).toBeInTheDocument();
    expect(screen.getByText("Mit")).toBeInTheDocument();
    expect(screen.getByText("Bodega externa")).toBeInTheDocument();
    expect(screen.getByText("Fridem")).toBeInTheDocument();
    expect(screen.getByText("Scraping")).toBeInTheDocument();
    expect(
      screen.getByText("operadormit@operadormit.com"),
    ).toBeInTheDocument();
    expect(screen.getByText("sol-1")).toBeInTheDocument();
  });

  it("resalta tarjetas pendientes con estilo interactivo", () => {
    const { container } = render(<IntegracionSolicitudCard row={baseRow} />);

    expect(container.querySelector("article")).toHaveClass("cursor-pointer");
  });

  it("muestra tarjeta atenuada cuando la solicitud ya está finalizada", () => {
    render(
      <IntegracionSolicitudCard
        row={{ ...baseRow, estado: "finalizado" }}
      />,
    );

    expect(screen.getByRole("article")).toHaveClass("opacity-80");
  });
});
