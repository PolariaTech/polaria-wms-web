import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CypherClienteVsMateoComparisonTable } from "./CypherClienteVsMateoComparisonTable";

describe("CypherClienteVsMateoComparisonTable", () => {
  it("muestra título y filas con Sin propuesta cuando Mateo está vacío", () => {
    render(
      <CypherClienteVsMateoComparisonTable
        title="Datos generales"
        rows={[
          {
            campo: "Cliente",
            correo: "Correo SA",
            mateo: "",
            usuario: "Usuario SA",
            coincidencia: "similar",
          },
        ]}
      />,
    );
    expect(screen.getByText("Datos generales")).toBeInTheDocument();
    expect(screen.getByText("Sin propuesta")).toBeInTheDocument();
    expect(screen.getByText("Correo SA")).toBeInTheDocument();
  });
});