import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsuarioAsignadoField } from "./usuario-create-modal.asignado-field";
import { INITIAL_FORM } from "./usuario-create-modal.constants";

describe("UsuarioAsignadoField", () => {
  it("pide elegir un rol primero cuando no hay tipo de asignación", () => {
    render(
      <UsuarioAsignadoField
        asignacionTipo={null}
        asignacionLabel="Asignado"
        form={INITIAL_FORM}
        setForm={vi.fn()}
        disabled={false}
        cuentasOpciones={[]}
        bodegasOpciones={[]}
      />,
    );

    expect(screen.getByPlaceholderText("Selecciona un rol primero")).toBeDisabled();
  });
});
