import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RecepcionLineaDraft } from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";
import { CustodioOrdenIngresoLineasList } from "./CustodioOrdenIngresoLineasList";

const LINEA: RecepcionLineaDraft = {
  idLineaOrdenCompra: "l-1",
  titulo: "Pollo",
  sku: "S1",
  cantidadPedida: 10,
  cantidadYaRecibida: 0,
  incluida: true,
  cantidadRecibidaInput: "",
  temperaturaInput: "",
};

describe("CustodioOrdenIngresoLineasList", () => {
  it("muestra inputs de línea incluida y propaga cambios", async () => {
    const onUpdateLinea = vi.fn();
    render(
      <CustodioOrdenIngresoLineasList
        lineas={[LINEA]}
        isSubmitting={false}
        onUpdateLinea={onUpdateLinea}
      />,
    );

    expect(screen.getByText("S1 Pollo")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Ej: -18"), "1");
    expect(onUpdateLinea).toHaveBeenCalledWith("l-1", { temperaturaInput: "1" });

    await userEvent.click(screen.getByRole("checkbox"));
    expect(onUpdateLinea).toHaveBeenCalledWith("l-1", { incluida: false });
  });

  it("oculta inputs si la línea no está incluida y respeta isSubmitting", () => {
    render(
      <CustodioOrdenIngresoLineasList
        lineas={[{ ...LINEA, incluida: false }]}
        isSubmitting
        onUpdateLinea={() => undefined}
      />,
    );

    expect(screen.queryByPlaceholderText("Ej: -18")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
