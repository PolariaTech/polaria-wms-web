import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompradorPreciosGestionModal } from "./CompradorPreciosGestionModal";

describe("CompradorPreciosGestionModal", () => {
  it("muestra Exportar, Importar e Imprimir", () => {
    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Gestión de precios" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Importar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
  });

  it("ejecuta exportar al hacer clic", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={onExport}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
