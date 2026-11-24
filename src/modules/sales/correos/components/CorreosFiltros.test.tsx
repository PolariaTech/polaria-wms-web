import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FILTROS_CORREOS_VACIOS } from "../types/correos.types";
import { CorreosFiltros } from "./CorreosFiltros";

describe("CorreosFiltros (REQ-387)", () => {
  it("muestra el botón de pendientes y dispara onAbrirReintentar", async () => {
    const onAbrir = vi.fn();
    const usuario = userEvent.setup();
    render(
      <CorreosFiltros
        filtros={FILTROS_CORREOS_VACIOS}
        onChange={vi.fn()}
        onLimpiar={vi.fn()}
        hayFiltros={false}
        onAbrirReintentar={onAbrir}
      />,
    );

    await usuario.click(
      screen.getByRole("button", { name: "Ver correos por reintentar" }),
    );
    expect(onAbrir).toHaveBeenCalledTimes(1);
  });

  it("sin callback no muestra el botón de reintentar", () => {
    render(
      <CorreosFiltros
        filtros={FILTROS_CORREOS_VACIOS}
        onChange={vi.fn()}
        onLimpiar={vi.fn()}
        hayFiltros={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Ver correos por reintentar" }),
    ).not.toBeInTheDocument();
  });
});
