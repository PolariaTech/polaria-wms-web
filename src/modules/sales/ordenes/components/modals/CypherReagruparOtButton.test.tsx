import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CypherReagruparOtButton,
  ETIQUETA_BOTON_REAGRUPAR,
} from "./CypherReagruparOtButton";

describe("CypherReagruparOtButton", () => {
  it("CA1: no se renderiza si no hay acción (OV que no está por confirmar)", () => {
    const { container } = render(<CypherReagruparOtButton />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("CA2: se muestra cuando hay acción y dispara el modal al hacer clic", async () => {
    const onClick = vi.fn();
    render(<CypherReagruparOtButton onClick={onClick} />);

    const boton = screen.getByRole("button", { name: ETIQUETA_BOTON_REAGRUPAR });
    expect(boton).toBeInTheDocument();

    await userEvent.setup().click(boton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("REQ-188: se llama «Modificar con IA»", () => {
    expect(ETIQUETA_BOTON_REAGRUPAR).toBe("Modificar con IA");
  });

  it("es un botón de tipo button (no envía formularios)", () => {
    render(<CypherReagruparOtButton onClick={() => undefined} />);

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
