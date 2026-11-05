import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../../print/orden-tarea-almacen.types";
import {
  OrdenVentaSeleccionOtModal,
  type OrdenVentaSeleccionOtModalProps,
} from "./OrdenVentaSeleccionOtModal";

function hoja(tareaIndex: number, centro: string, renglones = 3): OrdenTareaAlmacenPrintData {
  return {
    tareaIndex,
    tareaTotal: 3,
    centroConsumo: centro,
    lineas: Array.from({ length: renglones }, (_, i) => ({ producto: `P${i}` })),
  } as unknown as OrdenTareaAlmacenPrintData;
}

// OT 1 ocupa dos hojas (muchos renglones); OT 2 y OT 3, una cada una: 4 hojas en total.
const HOJAS = [hoja(1, "Cocina central", 49), hoja(1, "Cocina central", 5), hoja(2, "Bar"), hoja(3, "")];

function montar(extra: Partial<OrdenVentaSeleccionOtModalProps> = {}) {
  const props: OrdenVentaSeleccionOtModalProps = {
    open: true,
    accion: "imprimir",
    folio: "OV-00000123",
    onClose: vi.fn(),
    onConfirmar: vi.fn(),
    cargarHojas: vi.fn().mockResolvedValue(HOJAS),
    ...extra,
  };
  render(<OrdenVentaSeleccionOtModal {...props} />);
  return props;
}

const accion = (nombre: RegExp) => screen.getByRole("button", { name: nombre });
const casilla = (nombre: RegExp) => screen.getByRole("checkbox", { name: nombre });

describe("OrdenVentaSeleccionOtModal", () => {
  it("mientras lee las hojas lo dice y no deja confirmar", () => {
    montar({ cargarHojas: vi.fn(() => new Promise<OrdenTareaAlmacenPrintData[]>(() => undefined)) });

    expect(screen.getByRole("status")).toHaveTextContent("Leyendo las órdenes de trabajo…");
    expect(accion(/^Imprimir$/)).toBeDisabled();
  });

  it("lista una fila por OT con su centro, renglones y hojas, todas marcadas de entrada", async () => {
    montar();

    await screen.findByText("Todas las órdenes de trabajo");
    expect(casilla(/OT 1 de 3/)).toBeChecked();
    expect(casilla(/OT 2 de 3/)).toBeChecked();
    expect(casilla(/OT 3 de 3/)).toBeChecked();
    expect(screen.getByText("Cocina central")).toBeInTheDocument();
    expect(screen.getByText("54 renglones, 2 hojas")).toBeInTheDocument();
    // Las OT 2 y 3 tienen 3 renglones y una hoja cada una.
    expect(screen.getAllByText("3 renglones, 1 hoja")).toHaveLength(2);
    expect(screen.getByText("Sin centro de consumo")).toBeInTheDocument();
  });

  it("el botón dice cuántas hojas salen y se actualiza al marcar y desmarcar", async () => {
    montar();
    await screen.findByText("Todas las órdenes de trabajo");

    expect(accion(/Imprimir 4 hojas/)).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("3 de 3 OT, 4 hojas");

    await userEvent.click(casilla(/OT 1 de 3/));

    expect(accion(/Imprimir 2 hojas/)).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("2 de 3 OT, 2 hojas");
  });

  it("la casilla «Todas» marca y desmarca todo, y queda intermedia con una selección parcial", async () => {
    montar();
    const todas = await screen.findByRole("checkbox", { name: /Todas las órdenes de trabajo/ });

    await userEvent.click(casilla(/OT 2 de 3/));
    expect(todas).not.toBeChecked();
    expect((todas as HTMLInputElement).indeterminate).toBe(true);

    await userEvent.click(todas);
    expect(casilla(/OT 2 de 3/)).toBeChecked();
    expect(casilla(/OT 1 de 3/)).toBeChecked();

    await userEvent.click(todas);
    expect(casilla(/OT 1 de 3/)).not.toBeChecked();
    expect(casilla(/OT 3 de 3/)).not.toBeChecked();
  });

  it("sin ninguna elegida bloquea la acción y dice qué falta", async () => {
    montar();
    await userEvent.click(await screen.findByRole("checkbox", { name: /Todas las órdenes de trabajo/ }));

    expect(accion(/^Imprimir$/)).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Elige al menos una orden de trabajo.");
  });

  it("al confirmar entrega los números de las OT elegidas, de menor a mayor", async () => {
    const props = montar();
    await screen.findByText("Todas las órdenes de trabajo");
    await userEvent.click(casilla(/OT 2 de 3/));

    await userEvent.click(accion(/Imprimir 3 hojas/));

    expect(props.onConfirmar).toHaveBeenCalledWith([1, 3]);
  });

  it("Enter sobre una casilla no confirma: solo el botón envía", async () => {
    const props = montar();
    await screen.findByText("Todas las órdenes de trabajo");

    casilla(/OT 1 de 3/).focus();
    await userEvent.keyboard("{Enter}");

    expect(props.onConfirmar).not.toHaveBeenCalled();
  });

  it("al terminar de cargar el foco queda en la lista, listo para el teclado", async () => {
    montar();

    const todas = await screen.findByRole("checkbox", { name: /Todas las órdenes de trabajo/ });

    await waitFor(() => expect(todas).toHaveFocus());
  });

  it("en «Descarga» el título y el botón hablan de ver el PDF", async () => {
    montar({ accion: "descargar" });

    await screen.findByText("Todas las órdenes de trabajo");

    expect(screen.getByRole("heading", { name: "Descargar OV-00000123" })).toBeInTheDocument();
    expect(accion(/Ver PDF de 4 hojas/)).toBeEnabled();
    expect(screen.getByText(/Después podrás verlo y descargarlo/)).toBeInTheDocument();
  });

  it("avisa que la OV ya se imprimió solo al imprimir, sin pedir otra confirmación", async () => {
    const { rerender } = render(
      <OrdenVentaSeleccionOtModal
        open
        accion="imprimir"
        yaImpresa
        onClose={vi.fn()}
        onConfirmar={vi.fn()}
        cargarHojas={vi.fn().mockResolvedValue(HOJAS)}
      />,
    );
    expect(await screen.findByText(/ya se imprimió para alistamiento/)).toBeInTheDocument();

    rerender(
      <OrdenVentaSeleccionOtModal
        open
        accion="descargar"
        yaImpresa
        onClose={vi.fn()}
        onConfirmar={vi.fn()}
        cargarHojas={vi.fn().mockResolvedValue(HOJAS)}
      />,
    );
    expect(screen.queryByText(/ya se imprimió para alistamiento/)).not.toBeInTheDocument();
  });

  it("una OV de una sola OT no muestra la fila «Todas»", async () => {
    montar({ cargarHojas: vi.fn().mockResolvedValue([hoja(1, "Cocina")]) });

    await screen.findByText("Cocina");

    expect(screen.queryByText("Todas las órdenes de trabajo")).not.toBeInTheDocument();
    expect(accion(/Imprimir 1 hoja$/)).toBeEnabled();
  });

  it("si no se pueden leer las hojas lo dice y deja reintentar", async () => {
    const cargarHojas = vi.fn().mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(HOJAS);
    montar({ cargarHojas });

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron leer las órdenes de trabajo");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Todas las órdenes de trabajo")).toBeInTheDocument();
    expect(cargarHojas).toHaveBeenCalledTimes(2);
  });

  it("una OV sin hojas lo dice en vez de dejar la lista vacía", async () => {
    montar({ cargarHojas: vi.fn().mockResolvedValue([]) });

    expect(await screen.findByText(/no tiene órdenes de trabajo para el PDF/)).toBeInTheDocument();
    expect(accion(/^Imprimir$/)).toBeDisabled();
  });

  it("mientras hay un envío en curso no se puede cambiar la selección ni volver a enviar", async () => {
    montar({ ocupado: true });

    await screen.findByText("Todas las órdenes de trabajo");

    expect(casilla(/OT 1 de 3/)).toBeDisabled();
    expect(accion(/Imprimir 4 hojas/)).toBeDisabled();
  });

  it("Cancelar cierra sin enviar", async () => {
    const props = montar();
    await screen.findByText("Todas las órdenes de trabajo");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onConfirmar).not.toHaveBeenCalled();
  });

  it("cerrado no lee nada ni dibuja nada", () => {
    const cargarHojas = vi.fn().mockResolvedValue(HOJAS);

    const { container } = render(
      <OrdenVentaSeleccionOtModal open={false} accion="imprimir" onClose={vi.fn()} onConfirmar={vi.fn()} cargarHojas={cargarHojas} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(cargarHojas).not.toHaveBeenCalled();
  });

  it("al volver a abrirlo lee de nuevo y vuelve a marcar todas", async () => {
    const cargarHojas = vi.fn().mockResolvedValue(HOJAS);
    const props = { accion: "imprimir" as const, onClose: vi.fn(), onConfirmar: vi.fn(), cargarHojas };
    const { rerender } = render(<OrdenVentaSeleccionOtModal open {...props} />);
    await userEvent.click(await screen.findByRole("checkbox", { name: /Todas las órdenes de trabajo/ }));

    rerender(<OrdenVentaSeleccionOtModal open={false} {...props} />);
    rerender(<OrdenVentaSeleccionOtModal open {...props} />);

    await waitFor(() => expect(casilla(/OT 1 de 3/)).toBeChecked());
    expect(cargarHojas).toHaveBeenCalledTimes(2);
  });
});
