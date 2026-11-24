import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EstadoBodegaMapGrid } from "./EstadoBodegaMapGrid";

describe("EstadoBodegaMapGrid", () => {
  it("renderiza las cuatro zonas en el orden del mapa", () => {
    const rendered: string[] = [];
    render(
      <EstadoBodegaMapGrid
        mapRef={createRef<HTMLDivElement>()}
        renderSectionPanel={(id) => {
          rendered.push(id);
          return <span data-testid={id}>{id}</span>;
        }}
      />,
    );

    expect(rendered).toEqual(["entrada", "almacenamiento", "procesamiento", "salida"]);
    expect(screen.getByTestId("salida")).toBeInTheDocument();
  });
});
