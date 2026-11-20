import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FICHA_EN_BLANCO } from "../domain/empresa-ficha-fiscal";
import { EmpresaFichaFields } from "./EmpresaFichaFields";

describe("EmpresaFichaFields", () => {
  it("muestra los campos fiscales y el logo", () => {
    render(
      <EmpresaFichaFields
        idPrefix="empresa"
        valores={{ ...FICHA_EN_BLANCO, rfc: "APU210325668" }}
        disabled={false}
        logoNombreActual={null}
        vistaPrevia={null}
        onChange={vi.fn()}
        onLogo={vi.fn()}
        onQuitarLogo={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("RFC")).toHaveValue("APU210325668");
    expect(screen.getByLabelText("CLABE")).toBeInTheDocument();
    expect(screen.getByLabelText("Logo")).toBeInTheDocument();
    expect(screen.getByText("Sin logo")).toBeInTheDocument();
  });
});
