import { describe, expect, it } from "vitest";
import {
  buildOrigenCorreoFromOrdenesYLineas,
  groupOrigenCorreoToOrdenesTrabajo,
  type OrdenTrabajoHija,
} from "../origen/origen-correo-ordenes-trabajo";
import {
  aplicarReagrupacion,
  construirEstadoBaseApi,
  crearSnapshotReagrupacion,
  describirMovimientosPropuesta,
  describirReagrupacionParaBitacora,
  firmaEstadoReagrupacion,
  puedeReagruparOt,
  PropuestaInvalidaError,
  validarPropuestaContraBase,
  type LineaReagrupable,
  type OtPropuestaApi,
} from "./reagrupar-ordenes-trabajo";
import {
  hija,
  linea,
  parseCantidad,
  escenario,
  id,
  existente,
  nueva,
  plan5a3,
  congelarProfundo,
} from "./reagrupar-ordenes-trabajo.test-helpers";

describe("validarPropuestaContraBase (CA8)", () => {
  const preparar = () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);
    return { hijas, lineas, indice };
  };
  const todos = [id(0), id(1, 0), id(1, 1), id(2), id(3), id(4)];

  it("acepta un plan completo y consistente", () => {
    const { hijas, indice } = preparar();
    expect(() =>
      validarPropuestaContraBase({ ots: plan5a3() }, hijas, indice),
    ).not.toThrow();
  });

  it.each<[string, () => OtPropuestaApi[], string]>([
    ["pierde un renglón", () => [existente("ot-comedor", todos.slice(1))], "RENGLONES_NO_COINCIDEN"],
    [
      "duplica un renglón",
      () => [existente("ot-comedor", todos), existente("ot-spa", [id(4)])],
      "RENGLONES_NO_COINCIDEN",
    ],
    [
      "inventa un renglón",
      () => [existente("ot-comedor", [...todos, "renglon-9-9"])],
      "RENGLONES_NO_COINCIDEN",
    ],
    ["usa una OT inexistente", () => [existente("ot-fantasma", todos)], "OT_INEXISTENTE"],
    ["usa una clave de OT nueva inválida", () => [nueva("OTRA-1", todos)], "OT_INEXISTENTE"],
    [
      "repite una OT",
      () => [existente("ot-comedor", todos.slice(0, 3)), existente("ot-comedor", todos.slice(3))],
      "OT_DUPLICADA",
    ],
  ])("rechaza un plan que %s", (_nombre, plan, motivo) => {
    const { hijas, indice } = preparar();
    const intento = () => validarPropuestaContraBase({ ots: plan() }, hijas, indice);

    expect(intento).toThrow(PropuestaInvalidaError);
    expect(() => intento()).toThrowError(expect.objectContaining({ motivo }));
  });

  it("rechaza aplicar un plan inválido sin tocar el estado", () => {
    const { hijas, lineas, indice } = preparar();
    const antes = JSON.stringify({ hijas, lineas });

    expect(() =>
      aplicarReagrupacion({
        hijas,
        lineas,
        indice,
        propuesta: { ots: [existente("ot-comedor", todos.slice(1))] },
      }),
    ).toThrow(PropuestaInvalidaError);
    expect(JSON.stringify({ hijas, lineas })).toBe(antes);
  });
});

describe("movimientos y OT nuevas del resultado", () => {
  it("devuelve los movimientos con nombres legibles y las OT nuevas", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({
      hijas,
      lineas,
      indice,
      generarIdOt: () => "manual:nueva",
      propuesta: {
        ots: [
          existente("ot-comedor", [id(0), id(2)]),
          existente("ot-bares", [id(1, 0)]),
          nueva("NUEVA-1", [id(1, 1)], "Piñas"),
          existente("ot-cocina", [id(3)]),
          existente("ot-spa", [id(4)]),
        ],
      },
    });

    expect(res.movimientos).toEqual([
      { producto: "PAPAYA", cantidad: 10, desde: "PO-2 — BANQUETES", hacia: "PO-1 — COMEDOR" },
      { producto: "PIÑA", cantidad: 40, desde: "PO-1 — BARES", hacia: "Piñas" },
    ]);
    expect(res.otNuevas).toEqual([{ id: "manual:nueva", label: "Piñas" }]);
  });

  it("no lista como movimiento lo que se queda en su OT", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({
      hijas,
      lineas,
      indice,
      propuesta: {
        ots: [
          existente("ot-comedor", [id(0)]),
          existente("ot-bares", [id(1, 0), id(1, 1)]),
          existente("ot-banquetes", [id(2)]),
          existente("ot-cocina", [id(3)]),
          existente("ot-spa", [id(4)]),
        ],
      },
    });

    expect(res.movimientos).toEqual([]);
    expect(res.otNuevas).toEqual([]);
  });
});

describe("puedeReagruparOt (CA1, CA2)", () => {
  it("CA2: se permite con la OV por confirmar y 1 o más OT", () => {
    expect(puedeReagruparOt("por_confirmar", 1)).toBe(true);
    expect(puedeReagruparOt("por_confirmar", 5)).toBe(true);
    expect(puedeReagruparOt(" Por_Confirmar ", 2)).toBe(true);
  });

  it("CA1: no se permite en ningún otro estado ni sin OT", () => {
    for (const estado of ["confirmada", "alistamiento", "alistada", "cancelada", "", null, undefined]) {
      expect(puedeReagruparOt(estado, 3)).toBe(false);
    }
    expect(puedeReagruparOt("por_confirmar", 0)).toBe(false);
  });
});

describe("firmaEstadoReagrupacion", () => {
  it("es igual para el mismo estado y cambia si se edita un renglón, una cantidad o la OT de una línea", () => {
    const { hijas, lineas } = escenario();
    const base = firmaEstadoReagrupacion(hijas, lineas);

    expect(firmaEstadoReagrupacion(structuredClone(hijas), structuredClone(lineas))).toBe(base);

    const otraCantidad = structuredClone(lineas);
    otraCantidad[0].cantidadInput = "26";
    expect(firmaEstadoReagrupacion(hijas, otraCantidad)).not.toBe(base);

    const otraOt = structuredClone(lineas);
    otraOt[0].otId = "ot-bares";
    expect(firmaEstadoReagrupacion(hijas, otraOt)).not.toBe(base);

    const sinRenglon = structuredClone(hijas);
    sinRenglon[1].renglones.pop();
    expect(firmaEstadoReagrupacion(sinRenglon, lineas)).not.toBe(base);
  });
});

describe("describirReagrupacionParaBitacora (R12)", () => {
  const resumen = { antes: 5, despues: 3, nuevas: 0, vacias: 2 };

  it("arma el mensaje con el autor y el antes → después", () => {
    const { mensaje, payloadExtra } = describirReagrupacionParaBitacora({
      autor: "Demo Operador",
      instruccion: "  Junta bares y comedor  ",
      resumen,
      movimientos: [{ producto: "PAPAYA", cantidad: 10, desde: "A", hacia: "B" }],
      otNuevas: [],
    });

    expect(mensaje).toBe("Órdenes de trabajo reagrupadas con IA por Demo Operador: 5 → 3.");
    expect(payloadExtra).toEqual({
      reagrupacionIa: {
        instruccion: "Junta bares y comedor",
        resumen,
        movimientos: [{ producto: "PAPAYA", cantidad: 10, desde: "A", hacia: "B" }],
        otNuevas: [],
      },
    });
  });

  it("menciona las OT nuevas y trunca la instrucción a 500 caracteres", () => {
    const { mensaje, payloadExtra } = describirReagrupacionParaBitacora({
      autor: "Ana",
      instruccion: "x".repeat(900),
      resumen: { antes: 1, despues: 2, nuevas: 1, vacias: 0 },
      movimientos: [],
      otNuevas: [{ id: "manual:1", label: "Limones" }],
    });

    expect(mensaje).toBe("Órdenes de trabajo reagrupadas con IA por Ana: 1 → 2 (1 nueva).");
    const guardada = (payloadExtra.reagrupacionIa as { instruccion: string }).instruccion;
    expect(Array.from(guardada)).toHaveLength(500);
  });
});

describe("describirMovimientosPropuesta", () => {
  it("muestra producto, cantidad y las etiquetas legibles de origen y destino", () => {
    const { hijas, lineas } = escenario();
    const { estadoBase } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const vista = describirMovimientosPropuesta(
      {
        ots: [existente("ot-comedor", [id(0), id(2)]), nueva("NUEVA-1", [id(1, 1)], "<b>Piñas</b>")],
        movimientos: [
          { renglonId: id(2), deOtId: "ot-banquetes", aOtId: "ot-comedor" },
          { renglonId: id(1, 1), deOtId: "ot-bares", aOtId: "NUEVA-1" },
        ],
      },
      estadoBase,
    );

    expect(vista).toEqual([
      { producto: "PAPAYA", cantidad: 10, desde: "PO-2 — BANQUETES", hacia: "PO-1 — COMEDOR" },
      { producto: "PIÑA", cantidad: 40, desde: "PO-1 — BARES", hacia: "Piñas" },
    ]);
  });

  it("ignora un movimiento de un renglón que no existe (no inventa datos)", () => {
    const { hijas, lineas } = escenario();
    const { estadoBase } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    expect(
      describirMovimientosPropuesta(
        { ots: [], movimientos: [{ renglonId: "renglon-9-9", deOtId: "a", aOtId: "b" }] },
        estadoBase,
      ),
    ).toEqual([]);
  });
});
