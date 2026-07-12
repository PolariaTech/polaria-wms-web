import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OperarioTareaView } from "../types/operario-tarea.types";
import { OperarioTareaCard } from "./OperarioTareaCard";

const baseTarea: OperarioTareaView = {
  id_tarea: "tarea-1",
  codigo_cuenta: "MIT00",
  id_bodega: "bod-1",
  tipo: "movimiento",
  estado: "pendiente",
  id_asignado: "usr-1",
  id_orden_trabajo: "ord-1",
  titulo: "A bodega · OT-000001",
  descripcion: null,
  created_at: "2026-07-01T20:04:00.000Z",
  updated_at: "2026-07-01T20:04:00.000Z",
  tipoFlujo: "a_bodega",
  origenCodigo: "ING-02",
  destinoCodigo: "A-14",
  ordenCodigo: "OT-000001",
};

describe("OperarioTareaCard", () => {
  it("renderiza ingreso con slots de origen y destino", () => {
    render(<OperarioTareaCard tarea={baseTarea} />);

    expect(
      screen.getByText("Tarea de bodega · tocá para ejecutar y cerrar."),
    ).toBeInTheDocument();
    expect(screen.getByText("ING-02")).toBeInTheDocument();
    expect(screen.getByText("A-14")).toBeInTheDocument();
    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("tarea-1")).toBeInTheDocument();
  });

  it("ejecuta onComplete al tocar tarjeta pendiente", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<OperarioTareaCard tarea={baseTarea} onComplete={onComplete} />);

    await user.click(screen.getByRole("button"));
    expect(onComplete).toHaveBeenCalledWith(baseTarea);
  });
});
