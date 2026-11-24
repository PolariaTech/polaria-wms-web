import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompradorPreciosGruposSection } from "./comprador-precios-gestion-modal.grupos-section";

describe("CompradorPreciosGruposSection", () => {
  it("muestra mensaje vacío sin grupos", () => {
    render(
      <CompradorPreciosGruposSection
        catalogoGrupos={[]}
        selected={[]}
        onChange={() => undefined}
        disabled={false}
      />,
    );
    expect(
      screen.getByText(/No hay grupos pertenecientes/),
    ).toBeInTheDocument();
  });

  it("selecciona todos y alterna un grupo", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CompradorPreciosGruposSection
        catalogoGrupos={["A", "B"]}
        selected={[]}
        onChange={onChange}
        disabled={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccionar todos" }));
    expect(onChange).toHaveBeenLastCalledWith(["A", "B"]);

    await user.click(screen.getByLabelText("A"));
    expect(onChange).toHaveBeenLastCalledWith(["A"]);
  });

  it("ofrece quitar todos cuando todo está seleccionado", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CompradorPreciosGruposSection
        catalogoGrupos={["A", "B"]}
        selected={["A", "B"]}
        onChange={onChange}
        disabled={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quitar todos" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
