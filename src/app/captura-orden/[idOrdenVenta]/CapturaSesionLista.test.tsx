import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapturaSesionLista, type HojaAnterior } from "./CapturaSesionLista";

function hoja(sobrescribir: Partial<HojaAnterior> = {}): HojaAnterior {
  return {
    idOrdenVenta: "ov-1",
    idOrdenTrabajo: "ot-1",
    folio: "OV-00001",
    estado: "lista",
    ...sobrescribir,
  };
}

describe("CapturaSesionLista", () => {
  it("sin hojas anteriores no pinta nada", () => {
    const { container } = render(<CapturaSesionLista hojas={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el folio y el estado de cada hoja", () => {
    render(
      <CapturaSesionLista
        hojas={[
          hoja({ folio: "OV-00001", estado: "lista" }),
          hoja({ idOrdenTrabajo: "ot-2", folio: "OV-00002", estado: "subiendo" }),
        ]}
      />,
    );

    expect(screen.getByText("OV-00001")).toBeInTheDocument();
    expect(screen.getByText("Lista")).toBeInTheDocument();
    expect(screen.getByText("OV-00002")).toBeInTheDocument();
    expect(screen.getByText("Subiendo")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("distingue las hojas de una misma OV por su OT", () => {
    render(
      <CapturaSesionLista
        hojas={[
          hoja({ idOrdenTrabajo: "ot-1", etiqueta: "OT 1/9" }),
          hoja({ idOrdenTrabajo: "ot-2", etiqueta: "OT 2/9", estado: "fallo" }),
        ]}
      />,
    );

    expect(screen.getByText("OT 1/9")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /OV-00001 OT 2\/9: no se subió/i })).toBeInTheDocument();
  });

  it("una hoja que el servidor está procesando se muestra como «Procesando»", () => {
    render(<CapturaSesionLista hojas={[hoja({ estado: "procesando" })]} />);

    expect(screen.getByText("Procesando")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("una hoja que falló es un enlace a su página para repetirla", () => {
    render(
      <CapturaSesionLista
        hojas={[
          hoja({
            idOrdenVenta: "ov 9",
            idOrdenTrabajo: "ot-7",
            folio: "OV-00009",
            estado: "fallo",
          }),
        ]}
      />,
    );

    const enlace = screen.getByRole("link", { name: /OV-00009.*no se subió/i });
    expect(enlace).toHaveAttribute("href", "/captura-orden/ov%209?ot=ot-7");
  });
});
