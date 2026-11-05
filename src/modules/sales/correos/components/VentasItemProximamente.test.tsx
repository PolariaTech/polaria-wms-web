import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Camera } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VentasItemProximamente } from "./VentasItemProximamente";

function rect(partes: Partial<DOMRect>): DOMRect {
  return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}), ...partes };
}

function pantallaAncha(ancha: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: ancha }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
  // @ts-expect-error jsdom no define matchMedia; se limpia lo que pusieron las pruebas.
  delete window.matchMedia;
});

describe("VentasItemProximamente", () => {
  it("muestra la opción apagada", () => {
    const { container } = render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);

    const item = screen.getByText("Estado de fotos").closest("[aria-disabled='true']");
    expect(item).not.toBeNull();
    expect(item).toHaveClass("cursor-not-allowed");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("tiene el mismo fondo al pasar el mouse que las demás opciones del menú", () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);

    expect(screen.getByText("Estado de fotos").closest("[aria-disabled='true']")).toHaveClass(
      "hover:bg-polaria-w-08",
      "hover:text-polaria-w",
    );
  });

  it("no muestra el aviso hasta que el mouse o el teclado llegan, y lo quita al salir", async () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);
    const item = screen.getByText("Estado de fotos").closest("[aria-disabled='true']")!;
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await userEvent.hover(item);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Próximamente");
    await userEvent.unhover(item);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await userEvent.tab();
    expect(item).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("el aviso se dibuja fuera del menú (en el body), no dentro de la fila que se recorta", async () => {
    const { container } = render(
      <aside>
        <VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />
      </aside>,
    );

    await userEvent.hover(screen.getByText("Estado de fotos"));

    const aviso = screen.getByRole("tooltip");
    expect(container).not.toContainElement(aviso);
    expect(aviso.parentElement).toBe(document.body);
    expect(aviso).toHaveClass("fixed", "pointer-events-none");
  });

  it("en pantalla ancha va a la derecha del menú, centrado con el botón", () => {
    pantallaAncha(true);
    render(
      <aside data-testid="menu">
        <VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />
      </aside>,
    );
    vi.spyOn(screen.getByTestId("menu"), "getBoundingClientRect").mockReturnValue(rect({ right: 240 }));
    const item = screen.getByText("Estado de fotos").closest("[aria-disabled='true']")!;
    vi.spyOn(item, "getBoundingClientRect").mockReturnValue(rect({ top: 100, height: 40, bottom: 140 }));

    fireEvent.mouseEnter(item);

    const aviso = screen.getByRole("tooltip");
    expect(aviso).toHaveStyle({ left: "248px", top: "120px" });
    expect(aviso).toHaveClass("-translate-y-1/2");
  });

  it("en la tira de pantalla angosta va justo debajo del botón", () => {
    pantallaAncha(false);
    render(
      <aside data-testid="menu">
        <VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />
      </aside>,
    );
    const item = screen.getByText("Estado de fotos").closest("[aria-disabled='true']")!;
    vi.spyOn(item, "getBoundingClientRect").mockReturnValue(rect({ left: 60, top: 10, bottom: 50, height: 40 }));

    fireEvent.mouseEnter(item);

    expect(screen.getByRole("tooltip")).toHaveStyle({ left: "60px", top: "56px" });
  });

  it("si la página se desplaza con el aviso abierto, lo quita para que no quede flotando", async () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);
    await userEvent.hover(screen.getByText("Estado de fotos"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.scroll(window);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("los lectores de pantalla leen «Próximamente» desde la fila, sin necesitar el hover", () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);

    expect(screen.getByText("Próximamente")).toHaveClass("sr-only");
  });

  it("no es un enlace ni un botón: no lleva a ninguna parte", () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("acepta clases extra para acomodarse en el menú", () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" className="lg:ml-4" />);

    expect(screen.getByText("Estado de fotos").closest("[aria-disabled='true']")).toHaveClass("lg:ml-4");
  });
});
