import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImpresionBatchVistaPrevia } from "./ImpresionBatchVistaPrevia";
import type { PreviaBatch } from "./utilidades-batch";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:batch");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function montar(extra: Partial<Parameters<typeof ImpresionBatchVistaPrevia>[0]> = {}) {
  const props = {
    blob: new Blob(["%PDF"], { type: "application/pdf" }),
    hojas: 6,
    ot: 5,
    ov: 2,
    imprimiendo: false,
    nombreArchivo: "impresion-batch.pdf",
    onVolver: vi.fn(),
    onImprimir: vi.fn(),
    ...extra,
  };
  const vista = render(<ImpresionBatchVistaPrevia {...props} />);
  return { props, vista };
}

describe("ImpresionBatchVistaPrevia", () => {
  it("resume lo que lleva el PDF y lo muestra en un iframe", () => {
    montar();
    expect(screen.getByText("5 OT de 2 OV · 6 hojas · ordenadas por fecha y hora de entrega")).toBeInTheDocument();
    expect(screen.getByTitle(/Vista previa del PDF/)).toHaveAttribute("src", "blob:batch");
  });

  it("descarga el mismo PDF con el nombre dado", () => {
    montar();
    const enlace = screen.getByRole("link", { name: "Descargar PDF" });
    expect(enlace).toHaveAttribute("href", "blob:batch");
    expect(enlace).toHaveAttribute("download", "impresion-batch.pdf");
  });

  it("vuelve a la selección e imprime desde sus botones", async () => {
    const { props } = montar();
    await userEvent.click(screen.getByRole("button", { name: "Volver a la selección" }));
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(props.onVolver).toHaveBeenCalledTimes(1);
    expect(props.onImprimir).toHaveBeenCalledTimes(1);
  });

  it("mientras envía bloquea los botones", () => {
    montar({ imprimiendo: true });
    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver a la selección" })).toBeDisabled();
  });

  it("libera la URL del PDF al salir", () => {
    const { vista } = montar();
    vista.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:batch");
  });

  it("la impresión rápida cambia cómo describe el orden y el texto de volver", () => {
    montar({ descripcionOrden: "ordenadas por fecha, cantidad de OT y cliente", etiquetaVolver: "Cambiar la fecha" });

    expect(screen.getByText(/ordenadas por fecha, cantidad de OT y cliente/)).toBeInTheDocument();
    expect(screen.queryByText(/hora de entrega/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar la fecha" })).toBeInTheDocument();
  });

  it("una sola hoja va en singular", () => {
    montar({ hojas: 1, ot: 1, ov: 1 });
    expect(screen.getByText("1 OT de 1 OV · 1 hoja · ordenadas por fecha y hora de entrega")).toBeInTheDocument();
  });
});

describe("ImpresionBatchVistaPrevia con el paquete en varias partes", () => {
  const parte = (id: string) => ({ hojas: [], resumen: [], id });
  const previa = (partes?: unknown[]) =>
    ({ blob: new Blob(["x"]), hojas: [], resumen: [], nombreArchivo: "impresion-batch.pdf", partes }) as unknown as PreviaBatch;

  it("cambia el botón único por uno de descarga por cada parte", () => {
    montar({ descargaPartes: { previa: previa([parte("a"), parte("b")]), codigoCuenta: "1YW43" } });

    expect(screen.queryByRole("link", { name: "Descargar PDF" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar parte 1 de 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar parte 2 de 2" })).toBeInTheDocument();
  });

  it("con una sola parte deja el botón de descarga de siempre", () => {
    montar({ descargaPartes: { previa: previa([parte("a")]), codigoCuenta: "1YW43" } });

    expect(screen.getByRole("link", { name: "Descargar PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Descargar parte/ })).not.toBeInTheDocument();
  });
});
