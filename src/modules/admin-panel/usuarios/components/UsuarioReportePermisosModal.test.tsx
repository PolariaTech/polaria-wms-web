import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsuarioReportePermisosModal } from "./UsuarioReportePermisosModal";

const { getUsuarioReportePermisos, saveUsuarioReportePermisos } = vi.hoisted(
  () => ({
    getUsuarioReportePermisos: vi.fn(),
    saveUsuarioReportePermisos: vi.fn(),
  }),
);

vi.mock("../services/usuario-reporte-permisos.client", () => ({
  getUsuarioReportePermisos: (...args: unknown[]) =>
    getUsuarioReportePermisos(...args),
  saveUsuarioReportePermisos: (...args: unknown[]) =>
    saveUsuarioReportePermisos(...args),
}));

const USUARIOS = [
  {
    idUsuario: "usr-1",
    nombre: "Operador Demo",
    correo: "operador@empresa.com",
    telefono: "—",
    codigo: "OPER01",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
];

describe("UsuarioReportePermisosModal", () => {
  beforeEach(() => {
    getUsuarioReportePermisos.mockReset();
    saveUsuarioReportePermisos.mockReset();
  });

  it("abre la tabla de usuarios con lupa y guarda los reportes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    getUsuarioReportePermisos.mockResolvedValue({
      idUsuario: "usr-1",
      reports: [
        { id: "rep-a", descripcion: "Inventario TCI", reporteId: "aaa" },
        { id: "rep-b", descripcion: "Consolidado", reporteId: "bbb" },
      ],
      grantedIds: ["rep-a"],
    });
    saveUsuarioReportePermisos.mockResolvedValue(["rep-a", "rep-b"]);

    render(
      <UsuarioReportePermisosModal
        open
        usuarios={USUARIOS}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Permisos de reportes" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Buscar Usuario" }));

    expect(
      screen.getByRole("heading", { name: "Seleccionar usuario" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Código" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();

    await user.click(screen.getByText("Operador Demo"));

    await waitFor(() => {
      expect(getUsuarioReportePermisos).toHaveBeenCalledWith("usr-1");
    });

    expect(screen.getByLabelText("Inventario TCI")).toBeChecked();
    expect(screen.getByLabelText("Consolidado")).not.toBeChecked();

    await user.click(screen.getByLabelText("Consolidado"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(saveUsuarioReportePermisos).toHaveBeenCalledWith("usr-1", [
        "rep-a",
        "rep-b",
      ]);
    });
    expect(onClose).toHaveBeenCalled();
  });
});
