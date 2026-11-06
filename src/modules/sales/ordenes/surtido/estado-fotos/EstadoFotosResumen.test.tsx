import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EstadoFotosResumen } from "./EstadoFotosResumen";
import type { ResumenFotos } from "./estado-fotos.logic";

const RESUMEN: ResumenFotos = {
  recibida: 1,
  procesando: 2,
  lista: 30,
  fallo: 4,
  colgadas: 0,
  total: 37,
};

describe("EstadoFotosResumen", () => {
  it("muestra cuántas fotos hay en cada estado", () => {
    render(
      <EstadoFotosResumen resumen={RESUMEN} seleccionado={null} onSeleccionar={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /30\s*Listas/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /4\s*Con fallo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\s*Procesando/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1\s*Recibidas/ })).toBeInTheDocument();
  });

  it("«Todas» va primero, muestra el total y está activa cuando no hay filtro", () => {
    render(
      <EstadoFotosResumen resumen={RESUMEN} seleccionado={null} onSeleccionar={vi.fn()} />,
    );

    const botones = screen.getAllByRole("button");
    expect(botones[0]).toHaveTextContent(/37\s*Todas/);
    expect(botones[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Listas/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("«Todas» quita el filtro de estado y deja de estar activa mientras hay uno elegido", async () => {
    const onSeleccionar = vi.fn();
    render(
      <EstadoFotosResumen resumen={RESUMEN} seleccionado="fallo" onSeleccionar={onSeleccionar} />,
    );

    const todas = screen.getByRole("button", { name: /37\s*Todas/ });
    expect(todas).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(todas);

    expect(onSeleccionar).toHaveBeenCalledWith(null);
  });

  it("al pulsar un bloque filtra por ese estado", async () => {
    const onSeleccionar = vi.fn();
    render(
      <EstadoFotosResumen resumen={RESUMEN} seleccionado={null} onSeleccionar={onSeleccionar} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Con fallo/ }));

    expect(onSeleccionar).toHaveBeenCalledWith("fallo");
  });

  it("al pulsar el bloque ya activo quita el filtro", async () => {
    const onSeleccionar = vi.fn();
    render(
      <EstadoFotosResumen resumen={RESUMEN} seleccionado="fallo" onSeleccionar={onSeleccionar} />,
    );

    const activo = screen.getByRole("button", { name: /Con fallo/ });
    expect(activo).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(activo);

    expect(onSeleccionar).toHaveBeenCalledWith(null);
  });

  it("atenúa los ceros para que lo que sí hay, como un fallo, gane la vista", () => {
    render(
      <EstadoFotosResumen
        resumen={{ ...RESUMEN, procesando: 0, recibida: 0 }}
        seleccionado={null}
        onSeleccionar={vi.fn()}
      />,
    );

    const numero = (nombre: RegExp) =>
      screen.getByRole("button", { name: nombre }).querySelector("span");
    expect(numero(/Procesando/)).toHaveClass("text-polaria-w-50");
    expect(numero(/Recibidas/)).toHaveClass("text-polaria-w-50");
    expect(numero(/Con fallo/)).toHaveClass("text-polaria-danger");
    expect(numero(/Listas/)).toHaveClass("text-polaria-teal");
  });

  it("el aviso de colgadas dice qué hacer, no una suposición", () => {
    render(
      <EstadoFotosResumen
        resumen={{ ...RESUMEN, colgadas: 2 }}
        seleccionado={null}
        onSeleccionar={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Pide que las tomen de nuevo");
    expect(screen.getByRole("status")).not.toHaveTextContent("Probablemente");
  });

  it("avisa de las fotos colgadas solo cuando las hay", () => {
    const { rerender } = render(
      <EstadoFotosResumen resumen={RESUMEN} seleccionado={null} onSeleccionar={vi.fn()} />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(
      <EstadoFotosResumen
        resumen={{ ...RESUMEN, colgadas: 3 }}
        seleccionado={null}
        onSeleccionar={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "3 fotos llevan más de 2 minutos sin terminar",
    );

    rerender(
      <EstadoFotosResumen
        resumen={{ ...RESUMEN, colgadas: 1 }}
        seleccionado={null}
        onSeleccionar={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 foto lleva más de 2 minutos");
  });
});
