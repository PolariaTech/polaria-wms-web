import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReagruparOtPropuestaSection } from "./ReagruparOtPropuestaSection";

const resumen = { antes: 5, despues: 3, nuevas: 0, vacias: 2 };

describe("ReagruparOtPropuestaSection", () => {
  it("muestra el antes/después de OT y la frase del resumen", () => {
    render(<ReagruparOtPropuestaSection resumen={resumen} movimientos={[]} />);
    expect(screen.getByRole("heading", { name: "5 OT → 3 OT" })).toBeInTheDocument();
    expect(
      screen.getByText(/Se unen 2 OT que quedan sin productos\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ningún renglón se elimina/)).toBeInTheDocument();
  });

  it("sin movimientos no pinta la lista", () => {
    render(<ReagruparOtPropuestaSection resumen={resumen} movimientos={[]} />);
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("lista cada movimiento con producto, cantidad y OT de origen/destino", () => {
    render(
      <ReagruparOtPropuestaSection
        resumen={resumen}
        movimientos={[
          { producto: "PAPAYA", cantidad: 10, desde: "BANQUETES", hacia: "COMEDOR" },
          { producto: "AGUACATE", cantidad: "25", desde: "A", hacia: "B" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("PAPAYA");
    expect(items[0]).toHaveTextContent("BANQUETES → COMEDOR");
    expect(items[0]).toHaveTextContent("kg)");
    expect(items[1]).toHaveTextContent("AGUACATE");
  });

  it("la sección queda etiquetada como «Propuesta»", () => {
    render(<ReagruparOtPropuestaSection resumen={resumen} movimientos={[]} />);
    expect(screen.getByRole("region", { name: "Propuesta" })).toBeInTheDocument();
  });
});
