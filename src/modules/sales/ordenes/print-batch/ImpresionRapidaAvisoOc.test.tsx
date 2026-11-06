import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImpresionRapidaAvisoOc } from "./ImpresionRapidaAvisoOc";
import type { PreviaBatch } from "./utilidades-batch";

const previa = (filas: Array<{ venta: string; oc?: number }>): Pick<PreviaBatch, "resumenPdf" | "partes"> => ({
  resumenPdf: {
    titulo: "Resumen",
    subtitulo: "x",
    generado: "y",
    filas: filas.map((f) => ({ cliente: "Hotel", entrega: "01/11/2026", ot: 1, hojas: 1, ...f })),
  },
  partes: [{ hojas: [], resumen: [], pdf: new Blob(["pdf"]) }],
});

describe("ImpresionRapidaAvisoOc", () => {
  it("avisa con un mensaje ámbar qué OV salen sin OC y que sus órdenes de tarea sí salen", () => {
    render(<ImpresionRapidaAvisoOc previa={previa([{ venta: "OV-1", oc: 1 }, { venta: "OV-2" }])} />);

    const mensaje = screen.getByRole("status");
    expect(mensaje).toHaveTextContent("1 de 2 OV no tiene OC para imprimir.");
    expect(mensaje).toHaveTextContent("OV-2");
    expect(mensaje).toHaveTextContent("Sus órdenes de tarea sí salen.");
  });

  it("si todas las OV traen su OC no pinta nada", () => {
    const { container } = render(<ImpresionRapidaAvisoOc previa={previa([{ venta: "OV-1", oc: 2 }])} />);

    expect(container).toBeEmptyDOMElement();
  });
});
