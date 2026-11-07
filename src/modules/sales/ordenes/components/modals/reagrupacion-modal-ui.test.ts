import { describe, expect, it } from "vitest";
import {
  describirCambioDeOt,
  describirOrdenesNuevas,
  etiquetaDeValor,
  formatearCantidad,
  nombreDelCriterio,
  tituloDeLaDivision,
} from "./reagrupacion-modal-ui";

describe("reagrupacion-modal-ui", () => {
  it("el resumen de OT usa singular y plural correctos", () => {
    expect(describirCambioDeOt(0, 0)).toBe("");
    expect(describirCambioDeOt(1, 0)).toBe("Se crea 1 OT nueva. ");
    expect(describirCambioDeOt(2, 1)).toBe(
      "Se crean 2 OT nuevas. Se une 1 OT que queda sin productos. ",
    );
    expect(describirCambioDeOt(0, 3)).toBe("Se unen 3 OT que quedan sin productos. ");
  });

  it("formatea cantidades y deja intacto lo que no es número", () => {
    expect(formatearCantidad(1250.5)).toBe("1,250.5");
    expect(formatearCantidad("12")).toBe("12");
    expect(formatearCantidad("abc")).toBe("abc");
  });

  it("el título cuenta una orden nueva por cada OC que sale, más la actual", () => {
    expect(tituloDeLaDivision(1)).toBe("La orden se divide en 2 órdenes de venta");
    expect(tituloDeLaDivision(2)).toBe("La orden se divide en 3 órdenes de venta");
  });

  it("describe las órdenes nuevas en singular y en plural según el criterio", () => {
    expect(describirOrdenesNuevas("oc", 1)).toBe("Pasa a una orden de venta nueva");
    expect(describirOrdenesNuevas("oc", 2)).toBe(
      "Pasan a órdenes de venta nuevas, una por cada orden de compra",
    );
    expect(describirOrdenesNuevas("dia", 2)).toContain("una por cada día de entrega");
    expect(describirOrdenesNuevas("horario", 2)).toContain("una por cada horario de entrega");
  });

  it("nombra cada criterio con palabras del operador", () => {
    expect(nombreDelCriterio("oc")).toBe("orden de compra");
    expect(nombreDelCriterio("dia")).toBe("día de entrega");
    expect(nombreDelCriterio("horario")).toBe("horario de entrega");
  });

  it("cada valor se lee según su criterio, y el día se muestra como DD-MM-AAAA", () => {
    expect(etiquetaDeValor("oc", "4502988065")).toBe("Orden de compra 4502988065");
    expect(etiquetaDeValor("dia", "2026-11-08")).toBe("Entrega del 08-11-2026");
    expect(etiquetaDeValor("dia", "SÁBADO")).toBe("Entrega del SÁBADO");
    expect(etiquetaDeValor("horario", "06:00 - 08:00")).toBe(
      "Entrega en el horario 06:00 - 08:00",
    );
  });
});
