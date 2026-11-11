import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { GrupoInstruccion } from "../../utils/ot/instrucciones-frecuentes-reagrupacion";
import { LIMITE_INSTRUCCION_REAGRUPACION } from "../../utils/ot/reagrupacion-modal-estado";
import { ReagruparOtCampoInstruccion } from "./ReagruparOtCampoInstruccion";

const TODOS: GrupoInstruccion[] = ["reorganizar", "dividir", "corregir"];

function Campo({
  inicial = "",
  bloqueado = false,
  grupos = TODOS,
}: {
  inicial?: string;
  bloqueado?: boolean;
  grupos?: GrupoInstruccion[];
}) {
  const [valor, setValor] = useState(inicial);
  return (
    <ReagruparOtCampoInstruccion
      id="campo"
      valor={valor}
      bloqueado={bloqueado}
      gruposDisponibles={grupos}
      placeholder="Ejemplo"
      onCambio={setValor}
    />
  );
}

describe("ReagruparOtCampoInstruccion", () => {
  it("agrupa las instrucciones modelo por lo que la persona quiere hacer", () => {
    render(<Campo />);
    expect(
      screen.getByRole("group", { name: "Reorganizar las órdenes de trabajo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Dividir la orden de venta" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Corregir la lectura del correo" }),
    ).toBeInTheDocument();
  });

  it("solo muestra los grupos que el modal puede atender", () => {
    render(<Campo grupos={["reorganizar"]} />);
    expect(screen.queryByRole("group", { name: "Dividir la orden de venta" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Corregir la lectura del correo" })).toBeNull();
  });

  it("escribe la plantilla con sus huecos, deja el primero seleccionado y avisa que hay que completarlo", async () => {
    const usuario = userEvent.setup();
    render(<Campo />);
    await usuario.click(screen.getByRole("button", { name: "Mover un producto" }));
    const campo = screen.getByLabelText<HTMLTextAreaElement>("Instrucción");
    expect(campo).toHaveValue(
      "Mueve [producto] de la orden de [almacén de origen] a la orden de [almacén de destino].",
    );
    expect(campo).toHaveFocus();
    expect(campo.value.slice(campo.selectionStart, campo.selectionEnd)).toBe("[producto]");
    expect(screen.getByRole("status")).toHaveTextContent("Reemplaza lo que está entre corchetes");
  });

  it("al completar el único hueco ya no avisa", async () => {
    const usuario = userEvent.setup();
    render(<Campo />);
    await usuario.click(screen.getByRole("button", { name: "El total no coincide" }));
    const campo = screen.getByLabelText<HTMLTextAreaElement>("Instrucción");
    expect(campo.value.slice(campo.selectionStart, campo.selectionEnd)).toBe("[total]");
    await usuario.keyboard("27905.25");
    expect(campo.value).toContain("debe ser 27905.25.");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("no pisa lo escrito: agrega el modelo en una línea nueva", async () => {
    const usuario = userEvent.setup();
    render(<Campo inicial="Junta las OT de bares." />);
    await usuario.click(screen.getByRole("button", { name: "Por día de entrega" }));
    expect(screen.getByLabelText("Instrucción")).toHaveValue(
      "Junta las OT de bares.\nDivide la orden de venta por día de entrega: lo que se entrega el [día] pasa a una orden de venta nueva y lo demás se queda en esta.",
    );
  });

  it("los botones se deshabilitan cuando el campo está bloqueado", () => {
    render(<Campo bloqueado />);
    for (const boton of screen.getAllByRole("button")) {
      expect(boton).toBeDisabled();
    }
    expect(screen.getByLabelText("Instrucción")).toHaveAttribute("readonly");
  });

  it("avisa cuando la instrucción supera el límite", () => {
    render(<Campo inicial={"a".repeat(LIMITE_INSTRUCCION_REAGRUPACION + 1)} />);
    expect(screen.getByRole("alert")).toHaveTextContent("supera los");
  });
});
