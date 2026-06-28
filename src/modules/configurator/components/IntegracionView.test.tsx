import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IntegracionView } from "./IntegracionView";

describe("IntegracionView", () => {
  it("muestra encabezado, badges y estado vacío", () => {
    render(<IntegracionView />);

    expect(
      screen.getByRole("heading", { name: "Integración", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Solicitudes activas enviadas por el operador desde Bodega externa.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("0 solicitudes")).toBeInTheDocument();
    expect(screen.getByText("No hay solicitudes pendientes.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Las nuevas solicitudes aparecerán aquí automáticamente.",
      ),
    ).toBeInTheDocument();
  });
});
