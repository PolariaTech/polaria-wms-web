import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImpresionBatchMensaje } from "./ImpresionBatchMensaje";

describe("ImpresionBatchMensaje", () => {
  it("un error se anuncia como alerta", () => {
    render(<ImpresionBatchMensaje tipo="error">No se pudo leer OV-1.</ImpresionBatchMensaje>);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo leer OV-1.");
  });

  it.each(["ok", "aviso"] as const)("%s se anuncia como estado, no como alerta", (tipo) => {
    render(<ImpresionBatchMensaje tipo={tipo}>Enviado</ImpresionBatchMensaje>);
    expect(screen.getByRole("status")).toHaveTextContent("Enviado");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
