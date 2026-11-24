import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CAMION_TIPO_CATALOG } from "../catalog/camion-tipo-temperatura";
import { CAMION_MARCAS_CATALOG } from "../catalog/camion-vehiculos.catalog";
import type { CamionPickerKind } from "./camion-modal.helpers";
import { CamionVehiculoPickers } from "./CamionVehiculoPickers";

function renderPickers(picker: CamionPickerKind) {
  const props = {
    picker,
    onClose: vi.fn(),
    segmentoFilter: "",
    onSegmentoFilterChange: vi.fn(),
    marcaId: "",
    marca: "",
    modeloId: "",
    tipo: "",
    onSelectMarca: vi.fn(),
    onSelectModelo: vi.fn(),
    onSelectTipo: vi.fn(),
  };
  render(<CamionVehiculoPickers {...props} />);
  return props;
}

describe("CamionVehiculoPickers", () => {
  it("no muestra ningún modal sin picker activo", () => {
    renderPickers(null);
    expect(screen.queryByText("Seleccionar marca")).not.toBeInTheDocument();
    expect(screen.queryByText("Tipo de vehículo")).not.toBeInTheDocument();
  });

  it("selecciona una marca del catálogo", async () => {
    const user = userEvent.setup();
    const props = renderPickers("marca");
    expect(screen.getByText("Seleccionar marca")).toBeInTheDocument();

    const first = CAMION_MARCAS_CATALOG[0];
    await user.click(screen.getByText(first.nombre));

    expect(props.onSelectMarca).toHaveBeenCalledWith(first);
  });

  it("muestra el mensaje vacío de modelos sin marca elegida", () => {
    renderPickers("modelo");
    expect(
      screen.getByText("No hay modelos para esta marca en el catálogo."),
    ).toBeInTheDocument();
  });

  it("lista los tipos de vehículo", () => {
    renderPickers("tipo");
    expect(screen.getByText("Tipo de vehículo")).toBeInTheDocument();
    expect(screen.getAllByText(CAMION_TIPO_CATALOG[0].label).length).toBeGreaterThan(0);
  });
});
