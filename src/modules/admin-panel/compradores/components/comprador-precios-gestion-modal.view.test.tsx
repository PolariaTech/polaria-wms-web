import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CompradorPreciosGestionModal } from "./comprador-precios-gestion-modal.view";

describe("CompradorPreciosGestionModal (view)", () => {
  it("navega de acciones a exportar y regresa", async () => {
    const user = userEvent.setup();
    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={() => undefined}
        gruposDisponibles={["Grupo A"]}
        productos={[{ idProducto: "p-1", codigo: "DICOK", nombre: "Pollo" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(screen.getByText("Periodo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("button", { name: "Importar" })).toBeInTheDocument();
  });

  it("muestra el estado recibido por props", () => {
    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={() => undefined}
        status="Importación lista"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Importación lista");
  });
});
