import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CamionListRow } from "../services/camiones.service";
import { buildCamionesListColumns } from "./camiones-list-view.columns";

const row: CamionListRow = {
  idCamion: "abcdef12-0000",
  codigo: "CAM01",
  placa: "ABC123",
  marca: "Hino",
  modelo: "500",
  tipo: "refrigerado",
  capacidadKg: 1000,
  capacidadM3: 10,
  capacidadPallets: 4,
  rangoTemperatura: "-5/5",
  disponible: true,
  estaActivo: true,
  createdAt: "2026-01-01T00:00:00Z",
};

function setup() {
  const handlers = {
    setEditingCamion: vi.fn(),
    setToggleError: vi.fn(),
    setPendingToggle: vi.fn(),
  };
  return { handlers, columns: buildCamionesListColumns(handlers) };
}

describe("buildCamionesListColumns", () => {
  it("define el orden esperado de columnas", () => {
    const { columns } = setup();
    expect(columns.map((column) => column.id)).toEqual([
      "id",
      "codigo",
      "placa",
      "marca-modelo",
      "tipo",
      "peso-max",
      "volumen",
      "pallets",
      "rango-temp",
      "estado",
      "creado",
      "acciones",
    ]);
  });

  it("renderiza id y código de la fila", () => {
    const { columns } = setup();
    render(
      <>
        {columns[0].cell(row)}
        {columns[1].cell(row)}
      </>,
    );
    expect(screen.getByText("ABCDEF12")).toBeInTheDocument();
    expect(screen.getByText("CAM01")).toBeInTheDocument();
  });

  it("la acción de editar abre la edición del camión", async () => {
    const user = userEvent.setup();
    const { columns, handlers } = setup();
    const acciones = columns[columns.length - 1];
    render(<>{acciones.cell(row)}</>);

    await user.click(screen.getAllByRole("button")[0]);

    expect(handlers.setEditingCamion).toHaveBeenCalledWith(row);
  });
});
