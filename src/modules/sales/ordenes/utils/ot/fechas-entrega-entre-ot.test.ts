import { describe, expect, it } from "vitest";
import { createEmptyOrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { diasEntregaDistintosEnHijas } from "./fechas-entrega-entre-ot";

describe("diasEntregaDistintosEnHijas (REQ-337)", () => {
  it("devuelve un solo día si todas las OT coinciden", () => {
    const a = createEmptyOrdenTrabajoHija({ id: "a", fecha: "2026-11-14" });
    const b = createEmptyOrdenTrabajoHija({ id: "b", fecha: "2026-11-14" });
    expect(diasEntregaDistintosEnHijas([a, b])).toEqual(["2026-11-14"]);
  });

  it("lista los días distintos entre OT", () => {
    const a = createEmptyOrdenTrabajoHija({ id: "a", fecha: "2026-11-14" });
    const b = createEmptyOrdenTrabajoHija({ id: "b", fecha: "2026-11-15" });
    const c = createEmptyOrdenTrabajoHija({ id: "c", fecha: "2026-11-14" });
    expect(diasEntregaDistintosEnHijas([a, b, c])).toEqual([
      "2026-11-14",
      "2026-11-15",
    ]);
  });

  it("usa Fecha del renglón si hija.fecha viene vacía", () => {
    const hija = createEmptyOrdenTrabajoHija({ id: "x" });
    hija.fecha = "";
    hija.renglones = [{ Producto: "A", Cantidad: 1, Fecha: "2026-11-18" }];
    expect(diasEntregaDistintosEnHijas([hija])).toEqual(["2026-11-18"]);
  });
});
