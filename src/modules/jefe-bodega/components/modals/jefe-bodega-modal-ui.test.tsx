import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JefeBodegaModalSearchField } from "./jefe-bodega-modal-ui";

describe("JefeBodegaModalSearchField", () => {
  it("abre el picker al hacer clic en cualquier parte del campo, no solo la lupa", async () => {
    const user = userEvent.setup();
    const onSearchClick = vi.fn();

    render(
      <JefeBodegaModalSearchField
        id="cliente"
        value="205002154 — ABASTECEDORA MAXIMO"
        placeholder="Selecciona el cliente"
        ariaLabel="Cliente"
        onSearchClick={onSearchClick}
      />,
    );

    await user.click(screen.getByLabelText("Cliente"));
    expect(onSearchClick).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Buscar Cliente" }));
    expect(onSearchClick).toHaveBeenCalledTimes(2);
  });
});
