import { describe, expect, it } from "vitest";
import {
  aplicarInstruccionFrecuente,
  INSTRUCCIONES_FRECUENTES_REAGRUPACION,
  tieneHuecosSinCompletar,
} from "./instrucciones-frecuentes-reagrupacion";
import { LIMITE_INSTRUCCION_REAGRUPACION } from "./reagrupacion-modal-estado";

const TEXTO = "Divide la orden de venta por orden de compra.";

function instruccion(id: string) {
  const encontrada = INSTRUCCIONES_FRECUENTES_REAGRUPACION.find((i) => i.id === id);
  if (!encontrada) throw new Error(`Falta ${id}`);
  return encontrada;
}

describe("aplicarInstruccionFrecuente", () => {
  it("con el campo vacío deja solo la instrucción modelo, con el cursor al final", () => {
    const resultado = aplicarInstruccionFrecuente("  \n ", TEXTO);
    expect(resultado.valor).toBe(TEXTO);
    expect(resultado.seleccion).toEqual({ inicio: TEXTO.length, fin: TEXTO.length });
  });

  it("con texto escrito lo conserva y agrega el modelo en una línea nueva", () => {
    const resultado = aplicarInstruccionFrecuente("Junta las OT de bares. ", TEXTO);
    expect(resultado.valor).toBe(`Junta las OT de bares.\n${TEXTO}`);
  });

  it("no repite un modelo que ya está en el campo", () => {
    const actual = `Algo antes.\n${TEXTO}`;
    expect(aplicarInstruccionFrecuente(actual, TEXTO).valor).toBe(actual);
  });

  it("selecciona el primer hueco para que se escriba encima", () => {
    const texto = "El total del pedido debe ser [total].";
    const resultado = aplicarInstruccionFrecuente("Hola.", texto);
    expect(resultado.valor.slice(resultado.seleccion.inicio, resultado.seleccion.fin)).toBe(
      "[total]",
    );
  });
});

describe("tieneHuecosSinCompletar", () => {
  it("detecta un hueco entre corchetes y no marca el texto ya completo", () => {
    expect(tieneHuecosSinCompletar("Debería haber [número] órdenes.")).toBe(true);
    expect(tieneHuecosSinCompletar("Debería haber 4 órdenes.")).toBe(false);
  });
});

describe("INSTRUCCIONES_FRECUENTES_REAGRUPACION", () => {
  it("las de reorganizar y dividir son plantillas con huecos, sin nombres de ninguna orden", () => {
    expect(instruccion("juntar-ordenes").texto).toBe(
      "Junta las órdenes de trabajo de [almacén 1] y [almacén 2] en una sola. Deja todos los productos en la orden de [almacén 1].",
    );
    expect(instruccion("mover-producto").texto).toBe(
      "Mueve [producto] de la orden de [almacén de origen] a la orden de [almacén de destino].",
    );
    expect(instruccion("partir-orden").texto).toBe(
      "Divide la orden de trabajo de [almacén] en dos: deja [producto] en una orden nueva y el resto en la actual.",
    );
    expect(instruccion("dividir-por-oc").texto).toBe(
      "Divide la orden de venta por orden de compra: la orden de compra [número de orden de compra] pasa a una orden de venta nueva y las demás se quedan en esta.",
    );
  });

  it("todas las que piden un dato lo dejan como hueco por completar", () => {
    for (const id of [
      "juntar-ordenes",
      "mover-producto",
      "partir-orden",
      "dividir-por-oc",
      "dividir-por-dia",
      "dividir-por-horario",
      "total-no-coincide",
      "faltan-ordenes-de-trabajo",
    ]) {
      expect(tieneHuecosSinCompletar(instruccion(id).texto)).toBe(true);
    }
    expect(tieneHuecosSinCompletar(instruccion("nombres-incorrectos").texto)).toBe(false);
  });

  it("la de nombres incorrectos parte del texto pedido en REQ-300", () => {
    expect(instruccion("nombres-incorrectos").texto).toMatch(
      /^Vuelve a leer el correo\. Los nombres de los productos están incorrectos\./,
    );
  });

  it("ids y etiquetas únicos, y todas caben en el límite", () => {
    const ids = INSTRUCCIONES_FRECUENTES_REAGRUPACION.map((i) => i.id);
    const etiquetas = INSTRUCCIONES_FRECUENTES_REAGRUPACION.map((i) => i.etiqueta);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
    for (const i of INSTRUCCIONES_FRECUENTES_REAGRUPACION) {
      expect(i.texto.length).toBeLessThan(LIMITE_INSTRUCCION_REAGRUPACION);
    }
  });
});
