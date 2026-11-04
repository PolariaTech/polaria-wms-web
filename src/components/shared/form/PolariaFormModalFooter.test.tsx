import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PolariaFormModalFooter } from "./PolariaFormModalFooter";

describe("PolariaFormModalFooter", () => {
  it("pone footerBeforeCancel a la izquierda de Cancelar", () => {
    render(
      <PolariaFormModalFooter
        compact
        cancelLabel="Cancelar"
        submitLabel="Confirmar"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        submitDisabled={false}
        asForm
        footerBeforeCancel={<button type="button">Icono</button>}
      />,
    );
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    const icono = screen.getByRole("button", { name: "Icono" });
    expect(
      icono.compareDocumentPosition(cancelar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
