import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CypherResizeRail } from "./CypherResizeRail";

describe("CypherResizeRail", () => {
  it("expone el separator de redimensionar Cypher", () => {
    render(
      <CypherResizeRail
        isResizingWidth={false}
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("separator", { name: "Redimensionar panel Cypher" }),
    ).toBeInTheDocument();
  });

  it("marca el rail activo mientras se arrastra", () => {
    render(
      <CypherResizeRail
        isResizingWidth
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("separator", { name: "Redimensionar panel Cypher" }),
    ).toHaveClass("bg-polaria-teal/50");
  });
});
