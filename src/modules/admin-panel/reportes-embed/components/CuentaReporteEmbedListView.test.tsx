import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentaReporteEmbedListView } from "./CuentaReporteEmbedListView";

const { listCuentaReportesEmbedAdmin } = vi.hoisted(() => ({
  listCuentaReportesEmbedAdmin: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "023WA" }),
}));

vi.mock("../services/cuenta-reporte-embed-gestion.client", () => ({
  listCuentaReportesEmbedAdmin: (...args: unknown[]) =>
    listCuentaReportesEmbedAdmin(...args),
  createCuentaReporteEmbedAdmin: vi.fn(),
}));

vi.mock("./CuentaReporteEmbedCreateModal", () => ({
  CuentaReporteEmbedCreateModal: ({ open }: { open: boolean }) =>
    open ? <div>Modal cargar reporte</div> : null,
}));

vi.mock("./CuentaReporteEmbedEditModal", () => ({
  CuentaReporteEmbedEditModal: ({ open }: { open: boolean }) =>
    open ? <div>Modal editar reporte</div> : null,
}));

describe("CuentaReporteEmbedListView", () => {
  beforeEach(() => {
    listCuentaReportesEmbedAdmin.mockReset();
    listCuentaReportesEmbedAdmin.mockResolvedValue([
      {
        id: "rep-1",
        descripcion: "Reporte de inventario",
        reporteId: "8319190c-7a5c-48b2-9b1d-84701d583dd9",
        embedUrl: "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9",
        estaActivo: true,
      },
    ]);
  });

  it("lista los reportes de la cuenta y abre el alta", async () => {
    const user = userEvent.setup();
    render(<CuentaReporteEmbedListView />);

    await waitFor(() => {
      expect(screen.getByText("Reporte de inventario")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cargar reporte" }));
    expect(screen.getByText("Modal cargar reporte")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByText("Modal editar reporte")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Reporte ID" })).not.toBeInTheDocument();
  });
});
