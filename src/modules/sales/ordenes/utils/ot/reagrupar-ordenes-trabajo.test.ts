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

interface LineaTest extends LineaReagrupable {
  precioUnitario: number;
  unidadMedida: string;
}

function hija(params: {
  clave: string;
  almacen: string;
  pedido: string;
  renglones: Array<[string, number]>;
}): OrdenTrabajoHija {
  const renglones = params.renglones.map(([Producto, Cantidad]) => ({
    Producto,
    Cantidad,
    Unidad: "KGS",
    "Codigo producto": `COD-${Producto.slice(0, 3).toUpperCase()}`,
    "Notas generales": "NOTA-PRIVADA",
    "Telefono contacto": "5551234567",
  }));
  return {
    id: params.clave,
    label: `${params.pedido} — ${params.almacen}`,
    numeroPedido: params.pedido,
    almacen: params.almacen,
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    renglones,
    totalCantidad: params.renglones.reduce((suma, [, kg]) => suma + kg, 0),
  };
}

function linea(
  nombre: string,
  kg: number,
  otId: string | undefined,
): LineaTest {
  return {
    nombre,
    codigo: `COD-${nombre.slice(0, 3).toUpperCase()}`,
    cantidadInput: String(kg),
    otId,
    precioUnitario: 10,
    unidadMedida: "KGS",
  };
}

const parseCantidad = (raw: string) => Number(raw);

/** 5 OT, 6 renglones: comedor | bares(2) | banquetes | cocina | spa. */
function escenario() {
  const hijas = [
    hija({ clave: "ot-comedor", almacen: "COMEDOR", pedido: "PO-1", renglones: [["AGUACATE", 25]] }),
    hija({ clave: "ot-bares", almacen: "BARES", pedido: "PO-1", renglones: [["LIMON", 40], ["PIÑA", 40]] }),
    hija({ clave: "ot-banquetes", almacen: "BANQUETES", pedido: "PO-2", renglones: [["PAPAYA", 10]] }),
    hija({ clave: "ot-cocina", almacen: "COCINA", pedido: "PO-3", renglones: [["MELON", 12]] }),
    hija({ clave: "ot-spa", almacen: "SPA", pedido: "PO-4", renglones: [["SANDIA", 8]] }),
  ];
  const lineas = [
    linea("AGUACATE", 25, "ot-comedor"),
    linea("LIMON", 40, "ot-bares"),
    linea("PIÑA", 40, "ot-bares"),
    linea("PAPAYA", 10, "ot-banquetes"),
    linea("MELON", 12, "ot-cocina"),
    linea("SANDIA", 8, "ot-spa"),
  ];
  return { hijas, lineas };
}

/** Id estable de un renglón por (índice de OT, índice de renglón). */
const id = (indiceOt: number, indiceRenglon = 0) =>
  `renglon-${indiceOt}-${indiceRenglon}`;

function existente(otId: string, renglonIds: string[]): OtPropuestaApi {
  return { otId, nuevaClave: null, etiquetaSugerida: null, renglonIds };
}

function nueva(
  clave: string,
  renglonIds: string[],
  etiquetaSugerida: string | null = null,
): OtPropuestaApi {
  return { otId: null, nuevaClave: clave, etiquetaSugerida, renglonIds };
}

/** Plan 5→3: banquetes→comedor, cocina→bares, spa queda. */
function plan5a3(): OtPropuestaApi[] {
  return [
    existente("ot-comedor", [id(0), id(2)]),
    existente("ot-bares", [id(1, 0), id(1, 1), id(3)]),
    existente("ot-spa", [id(4)]),
  ];
}

function congelarProfundo<T>(valor: T): T {
  if (valor && typeof valor === "object") {
    Object.values(valor as Record<string, unknown>).forEach(congelarProfundo);
    Object.freeze(valor);
  }
  return valor;
}

describe("construirEstadoBaseApi", () => {
  it("arma ids estables y manda solo OT y renglones (sin notas ni teléfonos)", () => {
    const { hijas, lineas } = escenario();
    const { estadoBase, indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    expect(estadoBase.ots.map((ot) => ot.otId)).toEqual(hijas.map((h) => h.id));
    const ids = estadoBase.ots.flatMap((ot) => ot.renglones.map((r) => r.renglonId));
    expect(new Set(ids).size).toBe(6);
    expect(ids).toEqual(indice.orden);

    const json = JSON.stringify(estadoBase);
    expect(json).not.toContain("NOTA-PRIVADA");
    expect(json).not.toContain("5551234567");
    expect(estadoBase.ots[1].renglones[0]).toEqual({
      renglonId: id(1, 0),
      producto: "LIMON",
      cantidad: 40,
      unidad: "KGS",
    });
  });

  it("empareja cada renglón con una línea de su misma OT", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    expect(indice.porRenglonId.get(id(0))!.lineaIndex).toBe(0);
    expect(indice.porRenglonId.get(id(1, 1))!.lineaIndex).toBe(2);
    expect(indice.porRenglonId.get(id(4))!.lineaIndex).toBe(5);
  });

  it("no cruza líneas cuando el mismo producto y cantidad están en dos OT", () => {
    const hijas = [
      hija({ clave: "ot-x", almacen: "X", pedido: "PO-1", renglones: [["AGUACATE", 10]] }),
      hija({ clave: "ot-y", almacen: "Y", pedido: "PO-2", renglones: [["AGUACATE", 10]] }),
    ];
    const lineas = [
      linea("AGUACATE", 10, "ot-x"),
      linea("AGUACATE", 10, "ot-y"),
    ];
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    expect(indice.porRenglonId.get(id(0))!.lineaIndex).toBe(0);
    expect(indice.porRenglonId.get(id(1))!.lineaIndex).toBe(1);
  });

  it("usa líneas sin OT asignada cuando la OT no tiene líneas propias", () => {
    const { hijas } = escenario();
    const lineas = [
      linea("AGUACATE", 25, undefined),
      linea("LIMON", 40, undefined),
    ];
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    expect(indice.porRenglonId.get(id(0))!.lineaIndex).toBe(0);
    expect(indice.porRenglonId.get(id(1, 0))!.lineaIndex).toBe(1);
    expect(indice.porRenglonId.get(id(3))!.lineaIndex).toBeNull();
  });
});

describe("aplicarReagrupacion", () => {
  it("5 OT → 3: mueve renglones, conserva la identidad de las OT destino y recalcula totales", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({ hijas, lineas, propuesta: { ots: plan5a3() }, indice });

    expect(res.hijas.map((h) => h.id)).toEqual(["ot-comedor", "ot-bares", "ot-spa"]);
    expect(res.hijas[0].label).toBe("PO-1 — COMEDOR");
    expect(res.hijas[0].renglones.map((r) => r.Producto)).toEqual(["AGUACATE", "PAPAYA"]);
    expect(res.hijas[0].totalCantidad).toBe(35);
    expect(res.hijas[1].renglones.map((r) => r.Producto)).toEqual(["LIMON", "PIÑA", "MELON"]);
    expect(res.hijas[1].totalCantidad).toBe(92);
  });

  it("CA7: las líneas se reasignan y la distribución sobrevive al guardado", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({ hijas, lineas, propuesta: { ots: plan5a3() }, indice });

    // Las líneas de PAPAYA y MELON cambiaron de OT.
    expect(res.lineas.find((l) => l.nombre === "PAPAYA")!.otId).toBe("ot-comedor");
    expect(res.lineas.find((l) => l.nombre === "MELON")!.otId).toBe("ot-bares");

    // Round trip: lo que se guardaría (las líneas mandan sobre los renglones).
    const guardado = buildOrigenCorreoFromOrdenesYLineas({
      hijas: res.hijas,
      lineas: res.lineas.map((l) => ({
        otId: l.otId,
        nombre: l.nombre,
        codigo: l.codigo,
        cantidad: Number(l.cantidadInput),
        unidadMedida: l.unidadMedida,
        precioUnitario: l.precioUnitario,
      })),
    });
    const regrupado = groupOrigenCorreoToOrdenesTrabajo(guardado);

    expect(regrupado).toHaveLength(3);
    const productosPorOt = Object.fromEntries(
      regrupado.map((ot) => [ot.id, ot.renglones.map((r) => r.Producto).sort()]),
    );
    expect(productosPorOt).toEqual({
      "ot-comedor": ["AGUACATE", "PAPAYA"],
      "ot-bares": ["LIMON", "MELON", "PIÑA"],
      "ot-spa": ["SANDIA"],
    });
  });

  it("una OT que se queda sin renglones desaparece", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({ hijas, lineas, propuesta: { ots: plan5a3() }, indice });

    expect(res.hijas.some((h) => h.id === "ot-banquetes")).toBe(false);
    expect(res.hijas.some((h) => h.id === "ot-cocina")).toBe(false);
  });

  it("OT nueva: id generado, etiqueta saneada y almacén/pedido heredados de la única OT de origen", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({
      hijas,
      lineas,
      indice,
      generarIdOt: () => "manual:prueba-1",
      propuesta: {
        ots: [
          existente("ot-comedor", [id(0)]),
          existente("ot-bares", [id(1, 0)]),
          nueva("NUEVA-1", [id(1, 1)], "<b>Piñas aparte</b>"),
          existente("ot-banquetes", [id(2)]),
          existente("ot-cocina", [id(3)]),
          existente("ot-spa", [id(4)]),
        ],
      },
    });

    const creada = res.hijas.find((h) => h.id === "manual:prueba-1")!;
    expect(creada.label).toBe("Piñas aparte");
    expect(creada.almacen).toBe("BARES");
    expect(creada.numeroPedido).toBe("PO-1");
    expect(creada.renglones.map((r) => r.Producto)).toEqual(["PIÑA"]);
    expect(res.lineas.find((l) => l.nombre === "PIÑA")!.otId).toBe("manual:prueba-1");
    expect(res.hijas).toHaveLength(6);
  });

  it("OT nueva con renglones de varias OT: no hereda almacén ni pedido", () => {
    const { hijas, lineas } = escenario();
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

    const res = aplicarReagrupacion({
      hijas,
      lineas,
      indice,
      generarIdOt: () => "manual:mixta",
      propuesta: {
        ots: [
          existente("ot-comedor", [id(0)]),
          existente("ot-bares", [id(1, 0)]),
          existente("ot-cocina", [id(3)]),
          existente("ot-spa", [id(4)]),
          nueva("NUEVA-1", [id(1, 1), id(2)], null),
        ],
      },
    });

    const creada = res.hijas.find((h) => h.id === "manual:mixta")!;
    expect(creada.label).toBe("Nueva orden de trabajo");
    expect(creada.almacen).toBe("");
    expect(creada.numeroPedido).toBe("");
  });

  it("permite dividir una OV de 1 sola OT", () => {
    const una = hija({
      clave: "ot-unica",
      almacen: "COMEDOR",
      pedido: "PO-1",
      renglones: [["AGUACATE", 25], ["LIMON", 40]],
    });
    const lineas = [linea("AGUACATE", 25, "ot-unica"), linea("LIMON", 40, "ot-unica")];
    const { indice } = construirEstadoBaseApi([una], lineas, parseCantidad);

    const res = aplicarReagrupacion({
      hijas: [una],
      lineas,
      indice,
      generarIdOt: () => "manual:segunda",
      propuesta: {
        ots: [existente("ot-unica", [id(0, 0)]), nueva("NUEVA-1", [id(0, 1)], "Limones")],
      },
    });

    expect(res.hijas.map((h) => h.id)).toEqual(["ot-unica", "manual:segunda"]);
    expect(res.lineas.map((l) => l.otId)).toEqual(["ot-unica", "manual:segunda"]);
  });

  it("mueve los renglones que no tenían línea del formulario", () => {
    const { hijas, lineas } = escenario();
    const sinLineaDeMelon = lineas.filter((l) => l.nombre !== "MELON");
    const { indice } = construirEstadoBaseApi(hijas, sinLineaDeMelon, parseCantidad);

    const res = aplicarReagrupacion({
      hijas,
      lineas: sinLineaDeMelon,
      propuesta: { ots: plan5a3() },
      indice,
    });

    expect(res.hijas[1].renglones.map((r) => r.Producto)).toContain("MELON");
  });

  it("CA9: no modifica sus argumentos y el snapshot recupera el estado previo exacto", () => {
    const { hijas, lineas } = escenario();
    const antes = JSON.stringify({ hijas, lineas });
    const snapshot = crearSnapshotReagrupacion(hijas, lineas);
    const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);
    congelarProfundo(hijas);
    congelarProfundo(lineas);

    aplicarReagrupacion({ hijas, lineas, propuesta: { ots: plan5a3() }, indice });

    expect(JSON.stringify({ hijas, lineas })).toBe(antes);
    expect(snapshot).toEqual({ hijas, lineas });
  });
});

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
