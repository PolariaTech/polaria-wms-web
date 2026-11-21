import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecepcionPrefacturaForm } from "./RecepcionPrefacturaForm";

describe("RecepcionPrefacturaForm", () => {
  it("pide la opción, confirma y deja el flujo en Próximamente", () => {
    render(
      <RecepcionPrefacturaForm
        empresa="Y9IHZ"
        ov="OV-00002487"
        ot="unica"
        nombreEmpresa="Aguacates de puebla"
        cliente="Hotel Chicome"
        numeroOt="4500140182"
        totalOt="3"
        centroConsumo="Cantina"
      />,
    );
    expect(screen.getByText("Aguacates de puebla")).toBeTruthy();
    expect(screen.getByText("Hotel Chicome")).toBeTruthy();
    expect(screen.getByText("4500140182")).toBeTruthy();
    expect(screen.getByText("Cantina")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Aceptar" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Elige Aceptar, Aceptado parcial o Rechazado.",
    );

    fireEvent.click(screen.getByRole("radio", { name: "Aceptado parcial" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(
      screen.getByText("¿Estás de acuerdo con registrar un aceptado parcial?"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sí, confirmar" }));
    expect(screen.getByText("Próximamente")).toBeTruthy();
  });
});
