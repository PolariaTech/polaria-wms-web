import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentaReporteEmbedCreateModal } from "./CuentaReporteEmbedCreateModal";

const { createCuentaReporteEmbedAdmin } = vi.hoisted(() => ({
  createCuentaReporteEmbedAdmin: vi.fn(),
}));

vi.mock("../services/cuenta-reporte-embed-gestion.client", () => ({
  createCuentaReporteEmbedAdmin: (...args: unknown[]) =>
    createCuentaReporteEmbedAdmin(...args),
}));

describe("CuentaReporteEmbedCreateModal", () => {
  beforeEach(() => {
    createCuentaReporteEmbedAdmin.mockReset();
    createCuentaReporteEmbedAdmin.mockResolvedValue({
      id: "rep-1",
      descripcion: "Inventario",
      reporteId: "8319190c-7a5c-48b2-9b1d-84701d583dd9",
      embedUrl:
        "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9",
      estaActivo: true,
    });
  });

  it("pide descripción y URL y guarda el reporte", async () => {
    const user = userEvent.setup({ delay: null });
    const onClose = vi.fn();
    const onCreated = vi.fn();

    render(
      <CuentaReporteEmbedCreateModal
        open
        onClose={onClose}
        onCreated={onCreated}
      />,
    );

    await user.type(screen.getByLabelText(/Nombre del reporte/), "Inventario");
    await user.type(
      screen.getByLabelText(/URL del reporte/),
      "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9",
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(createCuentaReporteEmbedAdmin).toHaveBeenCalledWith({
        descripcion: "Inventario",
        embedUrl:
          "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9",
      });
    });
    expect(onCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("bloquea guardar sin descripción con el mensaje del schema", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <CuentaReporteEmbedCreateModal
        open
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText(/URL del reporte/),
      "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9",
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("La descripción del reporte es obligatoria."),
    ).toBeInTheDocument();
    expect(createCuentaReporteEmbedAdmin).not.toHaveBeenCalled();
  });

  it("bloquea URL inválida con el mensaje del schema", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <CuentaReporteEmbedCreateModal
        open
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Nombre del reporte/), "Inventario");
    await user.type(screen.getByLabelText(/URL del reporte/), "no-es-url");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Ingresa una URL válida (https://…)."),
    ).toBeInTheDocument();
    expect(createCuentaReporteEmbedAdmin).not.toHaveBeenCalled();
  });
});
