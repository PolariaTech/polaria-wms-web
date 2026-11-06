import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { quitarOtsDelFormulario } from "./quitar-ots-del-formulario";
import {
  construirEstadoBaseApi,
  type LineaReagrupable,
} from "./reagrupar-ordenes-trabajo";

function hija(clave: string, pedido: string, producto: string, kg: number): OrdenTrabajoHija {
  return {
    id: clave,
    label: `${pedido} — COCINA`,
    numeroPedido: pedido,
    almacen: "COCINA",
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    renglones: [{ Producto: producto, Cantidad: kg, Unidad: "KGS" }],
    totalCantidad: kg,
  };
}

const linea = (nombre: string, kg: number, otId?: string): LineaReagrupable => ({
  nombre,
  codigo: `COD-${nombre}`,
  cantidadInput: String(kg),
  otId,
});

const parseCantidad = (raw: string) => Number(raw);

describe("quitarOtsDelFormulario (REQ-262)", () => {
  const hijas = [
    hija("ot-1", "OC-1", "AGUACATE", 10),
    hija("ot-2", "OC-2", "LIMON", 8),
    hija("ot-3", "OC-2", "PIÑA", 5),
  ];
  const lineas = [
    linea("AGUACATE", 10, "ot-1"),
    linea("LIMON", 8, "ot-2"),
    linea("PIÑA", 5, "ot-3"),
  ];
  const { indice } = construirEstadoBaseApi(hijas, lineas, parseCantidad);

  it("quita las tareas que salen y sus líneas, y deja lo demás intacto", () => {
    const res = quitarOtsDelFormulario({
      hijas,
      lineas,
      otIdsQueSalen: ["ot-2", "ot-3"],
      indice,
    });

    expect(res.hijas.map((h) => h.id)).toEqual(["ot-1"]);
    expect(res.lineas.map((l) => l.nombre)).toEqual(["AGUACATE"]);
  });

  it("también quita una línea que solo se reconoce por su otId", () => {
    const sueltas = [...lineas, linea("MANGO", 3, "ot-2")];

    const res = quitarOtsDelFormulario({
      hijas,
      lineas: sueltas,
      otIdsQueSalen: ["ot-2"],
      indice,
    });

    expect(res.lineas.map((l) => l.nombre)).toEqual(["AGUACATE", "PIÑA"]);
  });

  it("sin tareas que salgan no cambia nada ni modifica las listas originales", () => {
    const res = quitarOtsDelFormulario({ hijas, lineas, otIdsQueSalen: [], indice });

    expect(res.hijas).toEqual(hijas);
    expect(res.lineas).toEqual(lineas);
    expect(hijas).toHaveLength(3);
  });
});
