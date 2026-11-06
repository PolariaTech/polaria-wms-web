import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CypherRecepcionCorreoStage } from "./CypherRecepcionCorreoStage";

vi.mock("./CypherOrigenAdjuntosBlock", () => ({
  CypherOrigenAdjuntosBlock: () => <div data-testid="adjuntos" />,
}));

describe("CypherRecepcionCorreoStage (REQ-271)", () => {
  it("usa número 00 — primera etapa de Cypher", () => {
    render(
      <CypherRecepcionCorreoStage
        openStages={new Set(["correo"])}
        toggleAccordionStage={vi.fn()}
        correoChrome={{}}
        origenNombres={[]}
        recibida=""
        cuerpoCompleto=""
        cuerpoMensaje=""
        origenAdjuntosStored={[]}
        emlInnerAdjuntos={[]}
        emlInnerLoading={false}
        origenAdjuntos={[]}
      />,
    );

    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("Recepción del correo")).toBeInTheDocument();
  });
});
