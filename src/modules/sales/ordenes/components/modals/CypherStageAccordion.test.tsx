import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CypherStageAccordion } from "./CypherStageAccordion";

describe("CypherStageAccordion", () => {
  it("muestra número y título; toggle llama onToggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CypherStageAccordion
        stageId="cambio-estado"
        num="04"
        title="Cambiar estado"
        open={false}
        onToggle={onToggle}
      >
        <p>contenido</p>
      </CypherStageAccordion>,
    );

    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("Cambiar estado")).toBeInTheDocument();
    expect(screen.queryByText("contenido")).not.toBeVisible();

    await user.click(screen.getByRole("button", { name: /Cambiar estado/i }));
    expect(onToggle).toHaveBeenCalledWith("cambio-estado");
  });

  it("sub-etapa nested sin número", () => {
    render(
      <CypherStageAccordion
        stageId="alistamiento"
        title="Alistamiento"
        open
        nested
        onToggle={vi.fn()}
      >
        <p>pipeline</p>
      </CypherStageAccordion>,
    );

    expect(screen.getByText("Alistamiento")).toBeInTheDocument();
    expect(screen.getByText("pipeline")).toBeVisible();
    expect(screen.queryByText("04")).not.toBeInTheDocument();
  });
});
