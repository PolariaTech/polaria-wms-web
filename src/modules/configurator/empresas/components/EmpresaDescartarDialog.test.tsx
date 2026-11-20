import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmpresaDescartarDialog } from "./EmpresaDescartarDialog";

describe("EmpresaDescartarDialog", () => {
  it("confirma salir o seguir editando", async () => {
    const user = userEvent.setup();
    const onSalir = vi.fn();
    const onSeguir = vi.fn();

    render(
      <EmpresaDescartarDialog open onSalir={onSalir} onSeguir={onSeguir} />,
    );

    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    await user.click(screen.getByRole("button", { name: "Salir" }));

    expect(onSeguir).toHaveBeenCalledTimes(1);
    expect(onSalir).toHaveBeenCalledTimes(1);
  });
});
