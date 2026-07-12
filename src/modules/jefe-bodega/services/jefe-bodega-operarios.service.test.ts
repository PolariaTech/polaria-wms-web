import { describe, expect, it } from "vitest";
import {
  formatOperarioPickerLabel,
  formatOperarioTareasLabel,
} from "./jefe-bodega-operarios.service";

describe("jefe-bodega-operarios.service", () => {
  it("formatea etiquetas de tareas", () => {
    expect(formatOperarioTareasLabel(0)).toBe("0 tareas");
    expect(formatOperarioTareasLabel(1)).toBe("1 tarea");
    expect(formatOperarioTareasLabel(3)).toBe("3 tareas");
  });

  it("formatea etiqueta del picker", () => {
    expect(
      formatOperarioPickerLabel({
        idUsuario: "u1",
        nombre: "Ana Ruiz",
        username: "ana.ruiz",
        tareasPendientes: 2,
        disponible: true,
      }),
    ).toBe("Ana Ruiz — 2 tareas");
  });
});
