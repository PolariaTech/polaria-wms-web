import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetaRow, PendingStageBody } from "./CypherStageMeta";

describe("CypherStageMeta", () => {
  it("renderiza MetaRow con label y contenido", () => {
    render(
      <div>
        <MetaRow label="TEST">contenido</MetaRow>
      </div>,
    );
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("renderiza PendingStageBody", () => {
    render(<PendingStageBody />);
    expect(screen.getByText("Aún no ocurre")).toBeInTheDocument();
  });
});
