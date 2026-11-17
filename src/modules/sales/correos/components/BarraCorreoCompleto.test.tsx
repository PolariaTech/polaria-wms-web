import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fila } from "../testing/correos.fixtures";
import { BarraCorreoCompleto } from "./BarraCorreoCompleto";

const navegacion = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegacion }));

describe("BarraCorreoCompleto", () => {
  beforeEach(() => {
    sessionStorage.clear();
    navegacion.back.mockReset();
    navegacion.push.mockReset();
  });
  afterEach(() => sessionStorage.clear());

  it("pone Ingresar como OV al lado de Volver, a todo el ancho", () => {
    render(
      <BarraCorreoCompleto
        messageId="msg-1"
        fila={fila({ messageId: "msg-1", ingreso: null, nuevoPedido: false })}
        onIngresar={vi.fn()}
      />,
    );

    const barra = screen.getByRole("toolbar", { name: "Acciones del correo" });
    expect(barra.className).toContain("w-full");
    const volver = screen.getByRole("button", { name: "Volver a los correos" });
    const ingresar = screen.getByRole("button", { name: /Ingresar como OV/ });
    expect(volver.parentElement).toBe(ingresar.parentElement);
    expect(barra).toContainElement(volver);
  });
});
