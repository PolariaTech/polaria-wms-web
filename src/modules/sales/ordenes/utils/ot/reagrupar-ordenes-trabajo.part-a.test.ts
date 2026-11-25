import { describe, expect, it } from "vitest";
import { buildOrigenCorreoFromOrdenesYLineas, groupOrigenCorreoToOrdenesTrabajo } from "../origen/origen-correo-ordenes-trabajo";
import { aplicarReagrupacion, construirEstadoBaseApi, crearSnapshotReagrupacion } from "./reagrupar-ordenes-trabajo";
import { hija, linea, parseCantidad, escenario, id, existente, nueva, plan5a3, congelarProfundo } from "./reagrupar-ordenes-trabajo.test-helpers";

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
