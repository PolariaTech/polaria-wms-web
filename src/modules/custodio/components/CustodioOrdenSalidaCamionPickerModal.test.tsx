import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustodioOrdenSalidaCamionPickerModal } from "./CustodioOrdenSalidaCamionPickerModal";

const CAMION = {
  idCamion: "c-1",
  placa: "ABC123",
  codigo: "CAM-1",
  marca: "Volvo",
  modelo: "FH",
  tipo: "refrigerado",
  capacidadKg: null,
  rangoTemperatura: null,
};

describe("CustodioOrdenSalidaCamionPickerModal", () => {
  it("renderiza camiones disponibles y permite seleccionarlos", async () => {
    const onSelect = vi.fn();
    render(
      <CustodioOrdenSalidaCamionPickerModal
        open
        onClose={() => undefined}
        camiones={[CAMION as never]}
        selectedKey={null}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Seleccionar camión")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("Volvo FH")).toBeInTheDocument();

    await userEvent.click(screen.getByText("ABC123"));
    expect(onSelect).toHaveBeenCalledWith(CAMION);
  });

  it("muestra mensaje vacío sin camiones", () => {
    render(
      <CustodioOrdenSalidaCamionPickerModal
        open
        onClose={() => undefined}
        camiones={[]}
        selectedKey={null}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText("No hay camiones disponibles.")).toBeInTheDocument();
  });
});
