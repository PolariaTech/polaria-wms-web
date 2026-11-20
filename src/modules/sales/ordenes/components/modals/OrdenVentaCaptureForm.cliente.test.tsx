import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCaptureFormCliente } from "./OrdenVentaCaptureForm";

describe("OrdenVentaCaptureFormCliente (REQ-363)", () => {
  it("con idComprador muestra coincidencia aunque haya sugerencias/priorityIds", () => {
    render(
      <OrdenVentaCaptureFormCliente
        idComprador="c-1"
        compradorLabel="HOSPITALITY SERVICES MAYA S.A. DE C.V."
        compradorNombreIa="Hilton CANCUN ALL-INCLUSIVE RESORT, MEXICO"
        haySugerencias
        missingFields={new Set()}
        onElegirCliente={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText("Cliente: razón social coincide con el catálogo"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Falta seleccionar cliente: razón social"),
    ).not.toBeInTheDocument();
  });

  it("sin idComprador y sin sugerencias muestra falta seleccionar", () => {
    render(
      <OrdenVentaCaptureFormCliente
        idComprador=""
        compradorLabel=""
        compradorNombreIa={null}
        haySugerencias={false}
        missingFields={new Set(["cliente"])}
        onElegirCliente={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText("Falta seleccionar cliente: razón social"),
    ).toBeInTheDocument();
  });

  it("sin idComprador pero con nombre IA muestra sin coincidencia exacta", () => {
    render(
      <OrdenVentaCaptureFormCliente
        idComprador=""
        compradorLabel=""
        compradorNombreIa="Hilton CANCUN"
        haySugerencias={false}
        missingFields={new Set(["cliente"])}
        onElegirCliente={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText(
        "Cliente: razón social sin coincidencia exacta en el catálogo",
      ),
    ).toBeInTheDocument();
  });
});
