import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsuarioIdentidadSection } from "./usuario-create-modal.sections";
import { INITIAL_FORM } from "./usuario-create-modal.constants";

describe("usuario-create-modal.sections", () => {
  it("renderiza nombre y correo de la identidad", () => {
    render(<UsuarioIdentidadSection form={INITIAL_FORM} setForm={vi.fn()} disabled={false} />);
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo/)).toBeInTheDocument();
  });
});
