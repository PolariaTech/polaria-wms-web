import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentaReporteEmbedEditModal } from "./CuentaReporteEmbedEditModal";

const { updateCuentaReporteEmbedAdmin } = vi.hoisted(() => ({
  updateCuentaReporteEmbedAdmin: vi.fn(),
}));

vi.mock("../services/cuenta-reporte-embed-gestion.client", () => ({
  updateCuentaReporteEmbedAdmin: (...args: unknown[]) =>
    updateCuentaReporteEmbedAdmin(...args),
}));

const REPORTE = {
  id: "rep-1",
  descripcion: "Reporte de inventario",
  reporteId: "8319190c-7a5c-48b2-9b1d-84701d583dd9",
  embedUrl: "https://chatbot-mateo.vercel.app/reporteinventario",
  estaActivo: true,
};

describe("CuentaReporteEmbedEditModal", () => {
  beforeEach(() => {
    updateCuentaReporteEmbedAdmin.mockReset();
    updateCuentaReporteEmbedAdmin.mockResolvedValue({
      ...REPORTE,
      descripcion: "Inventario TCI",
    });
  });

  it("guarda nombre, URL y estado sin pedir el id interno", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onUpdated = vi.fn();

    render(
      <CuentaReporteEmbedEditModal
        open
        reporte={REPORTE}
        onClose={onClose}
        onUpdated={onUpdated}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Editar reporte" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Reporte ID/i)).not.toBeInTheDocument();

    const nombre = screen.getByLabelText(/Nombre del reporte/);
    await user.clear(nombre);
    await user.type(nombre, "Inventario TCI");
    await user.click(screen.getByRole("button", { name: "Inactivo" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(updateCuentaReporteEmbedAdmin).toHaveBeenCalledWith({
        id: "rep-1",
        descripcion: "Inventario TCI",
        embedUrl: "https://chatbot-mateo.vercel.app/reporteinventario",
        estaActivo: false,
      });
    });
    expect(onUpdated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
