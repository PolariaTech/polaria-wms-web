import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogoImportFeedback } from "./catalogo-import-feedback";

describe("CatalogoImportFeedback", () => {
  it("no renderiza nada sin mensajes", () => {
    const { container } = render(
      <CatalogoImportFeedback importMessage={null} importError={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra estado y error", () => {
    render(
      <CatalogoImportFeedback importMessage="Importados 3" importError="Fila 2" />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Importados 3");
    expect(screen.getByRole("alert")).toHaveTextContent("Fila 2");
  });
});
