import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PolariaStatusLoading } from "./PolariaStatusLoading";

describe("PolariaStatusLoading", () => {
  it("muestra la card de carga con título y mensaje", () => {
    const { container } = render(
      <PolariaStatusLoading
        title="Cargando…"
        message="Estamos preparando la información."
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cargando…" })).toBeInTheDocument();
    expect(
      screen.getByText("Estamos preparando la información."),
    ).toBeInTheDocument();
    expect(container.querySelector(".polaria-card-glow")).toBeInTheDocument();
  });

  it("omite el recuadro interior cuando va embebido en una tabla", () => {
    const { container } = render(
      <PolariaStatusLoading
        title="Cargando…"
        message="Estamos preparando la información."
        embedded
      />,
    );

    expect(screen.getByRole("heading", { name: "Cargando…" })).toBeInTheDocument();
    expect(
      screen.getByText("Estamos preparando la información."),
    ).toBeInTheDocument();
    expect(container.querySelector(".polaria-card-glow")).not.toBeInTheDocument();
  });
});
