import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CypherBitacoraSection } from "./CypherBitacoraSection";
import type { OrdenVentaLogEntry } from "../../types/orden-venta-log.types";

const baseEntry: OrdenVentaLogEntry = {
  id: "log-1",
  createdAt: "2025-01-15T10:00:00.000Z",
  accion: "sintetico",
  mensaje: "Evento de prueba",
  autor: "tester",
  idOrdenTrabajo: null,
};

describe("CypherBitacoraSection", () => {
  it("muestra cargando cuando logLoading es true", () => {
    render(
      <CypherBitacoraSection
        logLoading
        logEntries={[]}
        zonaHoraria="America/Mexico_City"
        idOrdenTrabajoBitacora={null}
        activeOtPicker={null}
      />,
    );
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("muestra vacío cuando no hay entradas", () => {
    render(
      <CypherBitacoraSection
        logLoading={false}
        logEntries={[]}
        zonaHoraria="America/Mexico_City"
        idOrdenTrabajoBitacora={null}
        activeOtPicker={null}
      />,
    );
    expect(screen.getByText("Sin eventos registrados.")).toBeInTheDocument();
  });

  it("renderiza el mensaje de una entrada", () => {
    render(
      <CypherBitacoraSection
        logLoading={false}
        logEntries={[baseEntry]}
        zonaHoraria="America/Mexico_City"
        idOrdenTrabajoBitacora={null}
        activeOtPicker={null}
      />,
    );
    expect(screen.getByText("Evento de prueba")).toBeInTheDocument();
  });
});
