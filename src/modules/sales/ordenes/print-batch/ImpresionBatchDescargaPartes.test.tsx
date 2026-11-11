import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const armarPartePdf = vi.fn();
vi.mock("./armar-parte-pdf", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./armar-parte-pdf")>()),
  armarPartePdf: (...args: unknown[]) => armarPartePdf(...args),
}));

import { ImpresionBatchDescargaPartes } from "./ImpresionBatchDescargaPartes";
import type { ParteEnvio } from "./partir-paquete";
import type { PreviaBatch } from "./utilidades-batch";

function parte(id: string): ParteEnvio {
  return { hojas: [{ idOrdenVenta: id } as OrdenTareaAlmacenPrintData], resumen: [] };
}

function previa(partes: ParteEnvio[]): PreviaBatch {
  return {
    blob: new Blob(["x"]),
    hojas: partes.flatMap((p) => p.hojas),
    resumen: [],
    nombreArchivo: "impresion-batch-1.pdf",
    partes,
  };
}

let descargados: string[];

beforeEach(() => {
  vi.clearAllMocks();
  descargados = [];
  URL.createObjectURL = vi.fn(() => "blob:parte");
  URL.revokeObjectURL = vi.fn();
  armarPartePdf.mockResolvedValue(new Blob(["pdf"]));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    descargados.push(this.download);
  });
});

describe("ImpresionBatchDescargaPartes", () => {
  it("pone un botón por parte, con su posición en el texto", () => {
    render(<ImpresionBatchDescargaPartes previa={previa([parte("a"), parte("b"), parte("c")])} codigoCuenta="1YW43" />);

    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Descargar parte 1 de 3",
      "Descargar parte 2 de 3",
      "Descargar parte 3 de 3",
    ]);
  });

  it("al pulsar una parte arma solo esa y la baja con el nombre de la parte", async () => {
    const usuario = userEvent.setup();
    render(<ImpresionBatchDescargaPartes previa={previa([parte("a"), parte("b")])} codigoCuenta="1YW43" />);

    await usuario.click(screen.getByRole("button", { name: "Descargar parte 2 de 2" }));

    await waitFor(() => expect(descargados).toEqual(["impresion-batch-1-parte-2-de-2.pdf"]));
    expect(armarPartePdf).toHaveBeenCalledTimes(1);
    expect(armarPartePdf).toHaveBeenCalledWith(expect.objectContaining({ indice: 1, total: 2, codigoCuenta: "1YW43" }));
  });

  it("si no se puede armar la parte, lo dice con un mensaje claro y deja volver a intentar", async () => {
    const usuario = userEvent.setup();
    armarPartePdf.mockRejectedValueOnce(new Error("fallo interno"));
    render(<ImpresionBatchDescargaPartes previa={previa([parte("a"), parte("b")])} codigoCuenta="1YW43" />);

    await usuario.click(screen.getByRole("button", { name: "Descargar parte 1 de 2" }));

    expect(await screen.findByText("No se pudo preparar la parte 1. Vuelve a intentarlo.")).toBeInTheDocument();
    expect(screen.queryByText(/fallo interno/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar parte 1 de 2" })).toBeEnabled();
  });

  it("no deja descargar mientras se envía a la impresora", () => {
    render(<ImpresionBatchDescargaPartes previa={previa([parte("a"), parte("b")])} codigoCuenta="1YW43" deshabilitado />);

    for (const boton of screen.getAllByRole("button")) expect(boton).toBeDisabled();
  });
});
