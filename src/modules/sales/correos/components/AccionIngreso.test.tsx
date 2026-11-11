import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MSG, fila, ingreso } from "../testing/correos.fixtures";
import { AccionIngreso, AvisoDelFlujo } from "./AccionIngreso";

const sinFiltro = { nuevoPedido: null, motivo: null } as const;

describe("AccionIngreso (REQ-275)", () => {
  it("un ingreso vencido del api ofrece «Reintentar» con el motivo en el tooltip", async () => {
    render(
      <AccionIngreso
        fila={fila({
          ...sinFiltro,
          ingreso: ingreso({
            estado: "error",
            error: "El ingreso no terminó. Toca Reintentar.",
          }),
        })}
        onIngresar={vi.fn()}
      />,
    );
    const boton = screen.getByRole("button", { name: /Reintentar el ingreso/ });
    expect(boton).toHaveTextContent("Reintentar");
    expect(boton).toHaveAttribute("title", "El ingreso no terminó. Toca Reintentar.");
  });

  it("un ingreso fallido ofrece «Reintentar» y deja el error en el tooltip", async () => {
    const alIngresar = vi.fn();
    render(
      <AccionIngreso
        fila={fila({ ...sinFiltro, ingreso: ingreso({ estado: "error", error: "Sin stock" }) })}
        onIngresar={alIngresar}
      />,
    );

    const boton = screen.getByRole("button", { name: /Reintentar el ingreso/ });
    expect(boton).toHaveTextContent("Reintentar");
    expect(boton).toHaveAttribute("title", "Sin stock");
    await userEvent.click(boton);
    expect(alIngresar).toHaveBeenCalledWith(MSG);
  });

  it("un correo sin ingresar ofrece «Ingresar como OV», sin tooltip de error", () => {
    render(<AccionIngreso fila={fila({ nuevoPedido: false })} onIngresar={vi.fn()} />);

    const boton = screen.getByRole("button", { name: /Ingresar como OV del correo/ });
    expect(boton).toHaveTextContent("Ingresar como OV");
    expect(boton).not.toHaveAttribute("title");
  });

  it("un duplicado también deja ingresarlo, pero no dice «Reintentar»", () => {
    render(
      <AccionIngreso fila={fila({ ...sinFiltro, resultado: "duplicado" })} onIngresar={vi.fn()} />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Ingresar como OV");
  });

  it("con varias OV muestra la primera, «+N» y las demás para lectores de pantalla", () => {
    render(
      <AccionIngreso
        fila={fila({ ...sinFiltro, resultado: "ingresado", codigoOrdenVenta: "OV-1, OV-2, OV-3" })}
        onIngresar={vi.fn()}
      />,
    );

    expect(screen.getByText("OV-1")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText(/y también OV-2, OV-3/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("un ingreso en curso y un correo que el flujo sigue procesando no tienen botón", () => {
    const { rerender } = render(
      <AccionIngreso
        fila={fila({ ...sinFiltro, ingreso: ingreso({ estado: "procesando" }) })}
        onIngresar={vi.fn()}
      />,
    );
    expect(screen.getByText("Ingresando pedido…")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <AccionIngreso
        fila={fila({
          ...sinFiltro,
          resultado: "recibido",
          registradoEn: new Date().toISOString(),
        })}
        onIngresar={vi.fn()}
      />,
    );
    expect(screen.getByText("Procesando…")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("AvisoDelFlujo (REQ-275)", () => {
  it("dice el aviso con palabras, no con el código interno", () => {
    const { rerender } = render(<AvisoDelFlujo aviso="duplicado" />);
    expect(screen.getByText("Ya había una orden con ese número")).toBeInTheDocument();
    rerender(<AvisoDelFlujo aviso="flujoFallo" />);
    expect(screen.getByText("El flujo no pudo ingresarlo")).toBeInTheDocument();
    rerender(<AvisoDelFlujo aviso="sinProcesar" />);
    expect(screen.getByText("Sin procesar")).toBeInTheDocument();
  });

  it("«Revisar» lleva el motivo del flujo cuando lo hay", () => {
    const { rerender } = render(<AvisoDelFlujo aviso="revisar" motivo="Parece una foto" />);
    expect(screen.getByText("Revisar: Parece una foto")).toBeInTheDocument();
    rerender(<AvisoDelFlujo aviso="revisar" />);
    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });
});
