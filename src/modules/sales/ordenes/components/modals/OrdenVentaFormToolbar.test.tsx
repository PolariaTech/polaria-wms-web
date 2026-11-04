import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import { OrdenVentaFormStep } from "./OrdenVentaFormToolbar";

// Con catálogo vacío solo se pinta la franja superior: las secciones del formulario tienen sus pruebas.
function estadoToolbar(parcial: Record<string, unknown> = {}) {
  const espias: Record<string, ReturnType<typeof vi.fn>> = {};
  const datos: Record<string, unknown> = {
    isEditing: false,
    hijaFormActiva: null,
    ordenesTrabajoForm: [],
    afterCutoff: false,
    successMessage: null,
    hasProductos: false,
    emptyCatalogMessage: "No hay catálogo",
    startMode: "scratch",
    origenTexto: "",
    origenArchivosNombres: [],
    setStep: vi.fn(),
    setStartMode: vi.fn(),
    setError: vi.fn(),
    ...parcial,
  };
  const estado = new Proxy(datos, {
    get: (destino, clave: string) => (clave in destino ? destino[clave] : (espias[clave] ??= vi.fn())),
  }) as unknown as OrdenVentaFormEstado;
  return { estado, datos };
}

describe("OrdenVentaFormStep — franja superior (REQ-232)", () => {
  it("en una alta sin tarea activa ofrece volver al inicio y limpia el modo y el error", async () => {
    const user = userEvent.setup();
    const { estado, datos } = estadoToolbar();
    render(<OrdenVentaFormStep {...estado} />);

    await user.click(screen.getByRole("button", { name: "← Volver al inicio" }));

    expect(datos.setStep).toHaveBeenCalledWith("start");
    expect(datos.setStartMode).toHaveBeenCalledWith(null);
    expect(datos.setError).toHaveBeenCalledWith(null);
  });

  it("al editar una OV no ofrece volver al inicio", () => {
    const { estado } = estadoToolbar({ isEditing: true });
    render(<OrdenVentaFormStep {...estado} />);

    expect(screen.queryByRole("button", { name: "← Volver al inicio" })).not.toBeInTheDocument();
  });

  it("con una tarea activa no ofrece volver al inicio ni lleva botones de eliminar (pasaron al pie)", () => {
    const { estado } = estadoToolbar({
      hijaFormActiva: { id: "ot-1" },
      ordenesTrabajoForm: [{ id: "ot-1" }, { id: "ot-2" }],
    });
    render(<OrdenVentaFormStep {...estado} />);

    expect(screen.queryByRole("button", { name: "← Volver al inicio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
  });

  it("avisa que no hay catálogo y el horario de captura", () => {
    const { estado } = estadoToolbar({ afterCutoff: true });
    render(<OrdenVentaFormStep {...estado} />);

    expect(screen.getByText("No hay catálogo")).toBeInTheDocument();
    expect(screen.getByText(/Después del corte de las 17:00/)).toBeInTheDocument();
  });
});
