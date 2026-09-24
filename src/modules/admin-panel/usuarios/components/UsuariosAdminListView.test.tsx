import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsuariosAdminListView } from "./UsuariosAdminListView";

const { listUsuariosAdmin } = vi.hoisted(() => ({
  listUsuariosAdmin: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "FOODS1" }),
}));

vi.mock("../services/usuarios-admin.service", () => ({
  listUsuariosAdmin: (...args: unknown[]) => listUsuariosAdmin(...args),
  formatUsuarioAdminCreatedAt: () => "15/01/2026",
}));

vi.mock("./UsuarioAdminCreateModal", () => ({
  UsuarioAdminCreateModal: () => null,
}));

vi.mock("./UsuarioAdminDetalleModal", () => ({
  UsuarioAdminDetalleModal: () => null,
}));

vi.mock("./UsuarioAdminEditModal", () => ({
  UsuarioAdminEditModal: () => null,
}));

vi.mock("./UsuarioReportePermisosModal", () => ({
  UsuarioReportePermisosModal: ({ open }: { open: boolean }) =>
    open ? <div>Modal permisos de reportes</div> : null,
}));

describe("UsuariosAdminListView", () => {
  beforeEach(() => {
    listUsuariosAdmin.mockReset();
    listUsuariosAdmin.mockResolvedValue([]);
  });

  it("abre permisos de reportes desde la tabla", async () => {
    const user = userEvent.setup();
    render(<UsuariosAdminListView />);

    await user.click(
      screen.getByRole("button", { name: "Permisos de reportes" }),
    );

    expect(screen.getByText("Modal permisos de reportes")).toBeInTheDocument();
  });
});
