import { describe, expect, it } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { createEmptyOrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import {
  origenCorreoParaEnvio,
  parseLineasParaEnvio,
  textoOrigenParaPersistir,
} from "./payload-envio-ov";

function linea(partial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "p1",
    nombre: "Aguacate",
    codigo: "AGU",
    idBodega: "b1",
    cantidadInput: "2",
    cajasInput: "1",
    presentacion: "Granel",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: 10,
    unidadMedida: "kg",
    precioUnitario: 40,
    precioInput: "40",
    ...partial,
  };
}

describe("textoOrigenParaPersistir", () => {
  it("no guarda texto si no es edición ni viene de documentos", () => {
    expect(
      textoOrigenParaPersistir({
        isEditing: false,
        startMode: "scratch",
        origenTexto: "hola",
      }),
    ).toBe("");
  });
});

describe("parseLineasParaEnvio", () => {
  it("rechaza una cantidad vacía al confirmar", () => {
    const parsed = parseLineasParaEnvio({
      lineas: [linea({ cantidadInput: "" })],
      isDraft: false,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toContain("Aguacate");
    }
  });

  it("guarda cajas solo cuando son mayores que cero", () => {
    const parsed = parseLineasParaEnvio({
      lineas: [linea({ cajasInput: "0" })],
      isDraft: true,
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.lineas[0]?.cajas).toBeNull();
  });
});

describe("origenCorreoParaEnvio (REQ-201)", () => {
  const hija = createEmptyOrdenTrabajoHija({ id: "manual:ot-1", almacen: "CANTINA" });
  const parametros = (lineas: LineaVentaForm[]) => ({
    hijas: [hija],
    lineas,
    origenCorreoDraft: [],
    idComprador: "comp-1",
    compradorNombreIa: null,
    compradorLabel: "Hotel Demo",
  });

  it("guarda en el origen el producto ya verificado, para restaurarlo al reabrir", () => {
    const filas = origenCorreoParaEnvio(
      parametros([linea({ otId: "manual:ot-1", idProducto: "prod-1", catalogPending: false })]),
    );

    expect(filas[0]?._idProducto).toBe("prod-1");
  });

  it("no guarda producto de una línea que sigue pendiente de catálogo", () => {
    const filas = origenCorreoParaEnvio(
      parametros([linea({ otId: "manual:ot-1", idProducto: "prod-1", catalogPending: true })]),
    );

    expect(filas[0]?._idProducto).toBeUndefined();
  });
});
