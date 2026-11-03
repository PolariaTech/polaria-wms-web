import { describe, expect, it } from "vitest";
import {
  formatearFechaCompleta,
  formatearRecibido,
  separarAdjuntos,
  separarDirecciones,
} from "./correos-formato";

describe("formatearRecibido", () => {
  it("muestra la hora de Colombia (UTC-5) y tolera fechas vacías o inválidas", () => {
    expect(formatearRecibido("2026-11-03T13:27:51.000Z")).toMatch(/0?8:27/);
    expect(formatearRecibido(null)).toBe("—");
    expect(formatearRecibido("no-es-fecha")).toBe("—");
  });
});

describe("separarAdjuntos", () => {
  it("reparte los nombres que el flujo guarda separados por « | »", () => {
    expect(separarAdjuntos("PO_2000.pdf | detalle.xlsx |  foto.jpg ")).toEqual([
      "PO_2000.pdf",
      "detalle.xlsx",
      "foto.jpg",
    ]);
  });

  it("un solo adjunto, o ninguno, también funciona", () => {
    expect(separarAdjuntos("PO_2000.pdf")).toEqual(["PO_2000.pdf"]);
    expect(separarAdjuntos("")).toEqual([]);
    expect(separarAdjuntos(null)).toEqual([]);
    expect(separarAdjuntos(" | ")).toEqual([]);
  });
});

describe("separarDirecciones", () => {
  it("separa nombre y correo, y reparte varios destinatarios", () => {
    expect(
      separarDirecciones(
        '"Ana Torres" <ana@restaurantemar.example>, ventas@aguacates.example, Pedidos ADP <pedidos@aguacates.example>',
      ),
    ).toEqual([
      { nombre: "Ana Torres", correo: "ana@restaurantemar.example" },
      { nombre: null, correo: "ventas@aguacates.example" },
      { nombre: "Pedidos ADP", correo: "pedidos@aguacates.example" },
    ]);
  });

  it("una coma dentro de las comillas no parte a la persona", () => {
    expect(separarDirecciones('"Torres, Ana" <ana@x.example>, b@x.example')).toEqual([
      { nombre: "Torres, Ana", correo: "ana@x.example" },
      { nombre: null, correo: "b@x.example" },
    ]);
  });

  it("tolera vacíos y direcciones sin nombre", () => {
    expect(separarDirecciones(null)).toEqual([]);
    expect(separarDirecciones("  ")).toEqual([]);
    expect(separarDirecciones("<solo@x.example>")).toEqual([
      { nombre: null, correo: "solo@x.example" },
    ]);
  });
});

describe("formatearFechaCompleta", () => {
  it("muestra la fecha larga en hora de Colombia, sin segundos", () => {
    const texto = formatearFechaCompleta("2026-11-03T13:27:51.000Z");
    expect(texto).toMatch(/3 de noviembre de 2026/);
    expect(texto).not.toMatch(/:51/);
  });

  it("tolera fechas vacías o inválidas", () => {
    expect(formatearFechaCompleta(null)).toBe("—");
    expect(formatearFechaCompleta("no-es-fecha")).toBe("—");
  });
});
