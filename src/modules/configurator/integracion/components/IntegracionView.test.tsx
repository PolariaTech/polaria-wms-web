import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { IntegracionView } from "./IntegracionView";

const listSolicitudesIntegracionConfigurator = vi.fn();

vi.mock("../services/integracion.service", () => ({
  listSolicitudesIntegracionConfigurator: (...args: unknown[]) =>
    listSolicitudesIntegracionConfigurator(...args),
}));

describe("IntegracionView", () => {
  beforeEach(() => {
    listSolicitudesIntegracionConfigurator.mockReset();
    listSolicitudesIntegracionConfigurator.mockResolvedValue([]);
  });

  it("muestra encabezado y estado vacío sin badge Pendiente engañoso", async () => {
    render(<IntegracionView />);

    expect(
      screen.getByRole("heading", { name: "Integración", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Solicitudes activas enviadas por el operador desde Bodega externa.",
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("0 solicitudes")).toBeInTheDocument();
    });

    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
    expect(screen.getByText("No hay solicitudes pendientes.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Las nuevas solicitudes aparecerán aquí automáticamente.",
      ),
    ).toBeInTheDocument();
  });

  it("lista solicitudes en tarjetas y muestra badge de pendientes", async () => {
    listSolicitudesIntegracionConfigurator.mockResolvedValue([
      {
        idSolicitudIntegracion: "sol-1",
        codigoCuenta: "MIT00",
        cuentaNombre: "Mitre",
        bodegaExternaId: "bod-1",
        bodegaNombre: "Bodega Norte",
        tipoIntegracion: "api",
        estado: "activo",
        createdAt: "2026-06-28T12:00:00.000Z",
        solicitanteCorreo: "ops@mitre.com",
      },
      {
        idSolicitudIntegracion: "sol-2",
        codigoCuenta: "ACME1",
        cuentaNombre: "Acme",
        bodegaExternaId: "bod-2",
        bodegaNombre: "Bodega Sur",
        tipoIntegracion: "scraping",
        estado: "finalizado",
        createdAt: "2026-06-27T12:00:00.000Z",
      },
    ]);

    render(<IntegracionView />);

    await waitFor(() => {
      expect(screen.getByText("2 solicitudes")).toBeInTheDocument();
    });

    expect(screen.getByText("1 Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Mitre")).toBeInTheDocument();
    expect(screen.getByText("Bodega Norte")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Bodega Sur")).toBeInTheDocument();
    expect(screen.getByText("Scraping")).toBeInTheDocument();
    expect(screen.getByText("ops@mitre.com")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Solicitar integración/i })).not
      .toBeInTheDocument();
  });
});
