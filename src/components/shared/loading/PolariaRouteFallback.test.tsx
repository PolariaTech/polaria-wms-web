import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PolariaRouteFallback } from "./PolariaRouteFallback";

describe("PolariaRouteFallback", () => {
  it("pinta una tabla skeleton, no un spinner suelto", () => {
    const { container } = render(<PolariaRouteFallback />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(container.querySelectorAll("tbody tr").length).toBe(8);
    expect(screen.queryByRole("heading", { name: "Cargando…" })).not.toBeInTheDocument();
  });
});
