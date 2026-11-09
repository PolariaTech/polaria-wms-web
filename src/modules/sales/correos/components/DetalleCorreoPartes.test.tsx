import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fila, ingreso } from "../testing/correos.fixtures";
import { VeredictoFlujo } from "./DetalleCorreoPartes";

const sinFiltro = { nuevoPedido: null, motivo: null } as const;

describe("VeredictoFlujo (REQ-275)", () => {
  it("dice en qué OV quedó el correo, con todas si son varias", () => {
    render(
      <VeredictoFlujo
        fila={fila({ ...sinFiltro, resultado: "ingresado", codigoOrdenVenta: "OV-1, OV-2" })}
      />,
    );
    expect(screen.getByText("Ingresado como OV-1, OV-2")).toBeInTheDocument();
  });

  it("usa la OV del ingreso manual cuando ya terminó", () => {
    render(
      <VeredictoFlujo
        fila={fila({
          ...sinFiltro,
          ingreso: ingreso({ estado: "ingresado", codigoOrdenVenta: "OV-9" }),
        })}
      />,
    );
    expect(screen.getByText("Ingresado como OV-9")).toBeInTheDocument();
  });

  it("avisa de un duplicado y de un fallo del flujo", () => {
    const { rerender } = render(
      <VeredictoFlujo fila={fila({ ...sinFiltro, resultado: "duplicado" })} />,
    );
    expect(screen.getByText("Ya había una orden con ese número")).toBeInTheDocument();
    rerender(<VeredictoFlujo fila={fila({ ...sinFiltro, resultado: "error" })} />);
    expect(screen.getByText("El flujo no pudo ingresarlo")).toBeInTheDocument();
  });

  it("un correo que sigue procesándose no se presenta como ingresado", () => {
    render(
      <VeredictoFlujo
        fila={fila({
          ...sinFiltro,
          resultado: "recibido",
          registradoEn: new Date().toISOString(),
        })}
      />,
    );
    expect(screen.getByText("El flujo lo está procesando")).toBeInTheDocument();
  });

  it("mantiene los títulos de siempre para descartados y filas anteriores", () => {
    const { rerender } = render(<VeredictoFlujo fila={fila({ nuevoPedido: false })} />);
    expect(screen.getByText("Descartado por el flujo")).toBeInTheDocument();
    rerender(<VeredictoFlujo fila={fila(sinFiltro)} />);
    expect(screen.getByText("Ingresado por Mateo")).toBeInTheDocument();
  });

  it("muestra la seguridad del clasificador solo si existe", () => {
    const { rerender } = render(
      <VeredictoFlujo fila={fila({ nuevoPedido: false, confianza: "media" })} />,
    );
    expect(screen.getByText("Seguridad del clasificador: media")).toBeInTheDocument();
    rerender(<VeredictoFlujo fila={fila({ nuevoPedido: false })} />);
    expect(screen.queryByText(/Seguridad del clasificador/)).not.toBeInTheDocument();
  });
});
