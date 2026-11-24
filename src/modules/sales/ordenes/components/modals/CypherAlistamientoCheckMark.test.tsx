import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CypherAlistamientoCheckMark } from "./CypherAlistamientoCheckMark";

describe("CypherAlistamientoCheckMark", () => {
  it("muestra guión cuando no está marcado", () => {
    const { container } = render(<CypherAlistamientoCheckMark ok={false} />);
    expect(container.textContent).toContain("—");
  });

  it("expone aria-label cuando está marcado", () => {
    render(<CypherAlistamientoCheckMark ok={true} />);
    expect(screen.getByLabelText("Marcado")).toBeInTheDocument();
  });
});