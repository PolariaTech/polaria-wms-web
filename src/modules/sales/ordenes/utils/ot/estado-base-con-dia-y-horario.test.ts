import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { conDiaYHorario, horarioDeLaTarea } from "./estado-base-con-dia-y-horario";
import { construirEstadoBaseApi } from "./reagrupar-ordenes-trabajo";

function hija(
  id: string,
  fecha: string,
  renglon: Record<string, unknown>,
): OrdenTrabajoHija {
  return {
    id,
    label: `${id} — COCINA`,
    numeroPedido: id,
    almacen: "COCINA",
    referenciaPedido: "",
    fecha,
    responsableExterno: "",
    renglones: [{ Producto: "AGUACATE", Cantidad: 10, Unidad: "KGS", ...renglon }],
    totalCantidad: 10,
  };
}

describe("estado base con día y horario (REQ-262)", () => {
  it("el horario sale de la ventana desde-hasta y, sin ella, del texto Horario", () => {
    expect(
      horarioDeLaTarea(hija("a", "", { "Ventana desde": "06:00", "Ventana hasta": "08:00" })),
    ).toBe("06:00 - 08:00");
    expect(horarioDeLaTarea(hija("a", "", { "Ventana desde": " 06:00 " }))).toBe("06:00");
    expect(horarioDeLaTarea(hija("a", "", { Horario: " Mañana " }))).toBe("Mañana");
    expect(horarioDeLaTarea(hija("a", "", {}))).toBe("");
    expect(horarioDeLaTarea({ ...hija("a", "", {}), renglones: [] })).toBe("");
  });

  it("agrega día y horario a cada tarea sin tocar lo que ya llevaba", () => {
    const hijas = [
      hija("OC-1", "2026-11-07", { "Ventana desde": "06:00", "Ventana hasta": "08:00" }),
      hija("OC-2", "2026-11-08", { Horario: "Tarde" }),
    ];
    const { estadoBase } = construirEstadoBaseApi(hijas, [], (raw) => Number(raw));

    const res = conDiaYHorario(estadoBase, hijas);

    expect(res.ots.map((ot) => [ot.otId, ot.fecha, ot.horario])).toEqual([
      ["OC-1", "2026-11-07", "06:00 - 08:00"],
      ["OC-2", "2026-11-08", "Tarde"],
    ]);
    expect(res.ots[0]).toMatchObject({ numeroPedido: "OC-1", almacen: "COCINA" });
    expect(estadoBase.ots[0]).not.toHaveProperty("fecha");
  });

  it("una tarea sin día ni horario manda textos vacíos", () => {
    const hijas = [hija("OC-1", "", {})];
    const { estadoBase } = construirEstadoBaseApi(hijas, [], (raw) => Number(raw));

    expect(conDiaYHorario(estadoBase, hijas).ots[0]).toMatchObject({ fecha: "", horario: "" });
  });
});
