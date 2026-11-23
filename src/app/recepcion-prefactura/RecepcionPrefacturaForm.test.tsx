import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecepcionPrefacturaForm } from "./RecepcionPrefacturaForm";
import { aceptarRecepcionPrefactura } from "./aceptar-recepcion";

vi.mock("./aceptar-recepcion", () => ({
  aceptarRecepcionPrefactura: vi.fn(),
}));

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
    expect(aceptarRecepcionPrefactura).not.toHaveBeenCalled();
  });

  it("al aceptar muestra el folio que devolvió Compaq", async () => {
    vi.mocked(aceptarRecepcionPrefactura).mockResolvedValue({
      ok: true,
      mensaje: "Facturado. Folio CS-18.",
      error: "",
    });
    render(
      <RecepcionPrefacturaForm
        empresa="1XZ77"
        ov="OV-00000049"
        ot="pedido:4501110118|almacen:puebla xo01 xoximilco (consumo interno)"
        nombreEmpresa="DEMO"
        cliente="EXPERIENCIAS XCARET PARQUES SAPI DE CV"
        numeroOt="4501110118"
        totalOt="1"
        centroConsumo="PUEBLA XO01 XOXIMILCO (Consumo Interno)"
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Aceptar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, confirmar" }));
    expect(await screen.findByText("Facturado. Folio CS-18.")).toBeTruthy();
  });
});
