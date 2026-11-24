import { describe, expect, it } from "vitest";
import {
  emptyOrdenVentaCapturaParsed,
  parseOrdenVentaCapturaObservaciones,
} from "./build-orden-venta-captura-observaciones-ficha-parse";
import { buildOrdenVentaCapturaObservaciones } from "./build-orden-venta-captura-observaciones-ficha";
import * as desdeFicha from "./build-orden-venta-captura-observaciones-ficha";

describe("parseOrdenVentaCapturaObservaciones", () => {
  it("devuelve la ficha vacía con texto vacío o nulo", () => {
    expect(parseOrdenVentaCapturaObservaciones(null)).toEqual(
      emptyOrdenVentaCapturaParsed(),
    );
    expect(parseOrdenVentaCapturaObservaciones("   ")).toEqual(
      emptyOrdenVentaCapturaParsed(),
    );
  });

  it("lee los campos etiquetados de la ficha", () => {
    const parsed = parseOrdenVentaCapturaObservaciones(
      "Fecha de entrega: 2026-12-01\nPrioridad: Alta\nCorreo: a@b.com",
    );

    expect(parsed.fechaEntrega).toBe("2026-12-01");
    expect(parsed.prioridad).toBe("Alta");
    expect(parsed.correo).toBe("a@b.com");
  });

  it("recupera lo que armó buildOrdenVentaCapturaObservaciones", () => {
    const texto = buildOrdenVentaCapturaObservaciones({
      ...Object.fromEntries(
        Object.keys(emptyOrdenVentaCapturaParsed()).map((k) => [k, ""]),
      ),
      fechaEntrega: "2026-12-02",
      ventanaDesde: "",
      ventanaHasta: "",
      origenTexto: "",
      origenArchivos: ["pedido.pdf"],
      notasLineas: "",
      observaciones: "Llamar al llegar",
      moneda: "MXN",
    } as never);

    const parsed = parseOrdenVentaCapturaObservaciones(texto);

    expect(parsed.fechaEntrega).toBe("2026-12-02");
    expect(parsed.moneda).toBe("MXN");
    expect(parsed.origenArchivos).toEqual(["pedido.pdf"]);
    expect(parsed.observaciones).toBe("Llamar al llegar");
  });

  it("la ruta del archivo ficha exporta el mismo parser", () => {
    expect(desdeFicha.parseOrdenVentaCapturaObservaciones).toBe(
      parseOrdenVentaCapturaObservaciones,
    );
  });
});
