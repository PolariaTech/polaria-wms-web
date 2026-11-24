import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CypherAlistamientoOtArticle } from "./CypherAlistamientoOtArticle";

describe("CypherAlistamientoOtArticle", () => {
  it("muestra estado impresa sin escanear cuando no hay captura", () => {
    render(
      <CypherAlistamientoOtArticle
        hija={{
          id: "ot-a",
          label: "Cocina principal",
          numeroPedido: "",
          almacen: "Cocina principal",
          referenciaPedido: "",
          fecha: "",
          responsableExterno: "",
          renglones: [],
          totalCantidad: 0,
        }}
        index={0}
        orden={{ lineas: [] } as never}
        otsCount={1}
        capturaByOt={new Map()}
        impresaAt="2026-01-01T10:00:00Z"
        now={Date.parse("2026-01-01T12:00:00Z")}
      />,
    );
    expect(screen.getByText(/Impresa, sin escanear/i)).toBeInTheDocument();
  });
});