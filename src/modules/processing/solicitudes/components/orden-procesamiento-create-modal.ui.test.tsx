import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ProcesamientoEstimadoBody,
  ProcesamientoFieldBox,
} from "./orden-procesamiento-create-modal.ui";

describe("orden-procesamiento-create-modal.ui", () => {
  it("renderiza la etiqueta y el contenido del campo", () => {
    render(
      <ProcesamientoFieldBox label="Conversión">
        <span>contenido</span>
      </ProcesamientoFieldBox>,
    );
    expect(screen.getByText("Conversión")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("pide indicar la conversión cuando no hay desglose", () => {
    render(<ProcesamientoEstimadoBody desgloseEstimado={null} perdidaPctDelCatalogo={0} />);
    expect(screen.getByText("Indicá conversión.")).toBeInTheDocument();
  });
});
