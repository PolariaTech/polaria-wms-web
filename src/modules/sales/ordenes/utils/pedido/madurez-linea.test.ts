import { describe, expect, it } from "vitest";
import {
  aplicarMadurezDesdeTexto,
  filasMadurezDesdeTexto,
} from "./madurez-linea";

describe("filasMadurezDesdeTexto", () => {
  it("lee la columna Maduración de cada renglón", () => {
    const filas = filasMadurezDesdeTexto(
      [
        "De: Pedidos · Aguacates de Puebla <admonaguacatesdepuebla@gmail.com>",
        "",
        "Producto          Cantidad   Maduración",
        "Aguacate Hass     10         Pintón",
        "Jitomate Saladet  5          Rojo",
        "Cebolla Blanca    3",
        "Plátano           8          enrriados",
      ].join("\n"),
    );

    expect(filas).toEqual([
      { producto: "Aguacate Hass", madurez: "Pintón" },
      { producto: "Jitomate Saladet", madurez: "Rojo" },
      { producto: "Plátano", madurez: "Enrriado" },
    ]);
  });

  it("no convierte el glosario Madurez: del catálogo en productos", () => {
    expect(
      filasMadurezDesdeTexto(
        ["Madurez:", "Verde: sin madurar", "Pintón: a punto"].join("\n"),
      ),
    ).toEqual([]);
  });
});

describe("aplicarMadurezDesdeTexto", () => {
  it("REQ-158: llena la especificación de los productos que el modelo dejó vacíos", () => {
    const texto = [
      "Producto          Maduración",
      "Aguacate Hass     Pintón",
      "Jitomate Saladet  Rojo",
      "Cebolla Blanca",
      "Plátano           Maduro",
    ].join("\n");

    const lineas = aplicarMadurezDesdeTexto(
      [
        { textoOriginal: "Aguacate Hass", especificacion: null },
        { textoOriginal: "Jitomate Saladet", especificacion: null },
        { textoOriginal: "Cebolla Blanca", especificacion: null },
        { textoOriginal: "Plátano", especificacion: "Maduro" },
      ],
      texto,
    );

    expect(lineas.map((linea) => linea.especificacion)).toEqual([
      "Pintón",
      "Rojo",
      null,
      "Maduro",
    ]);
  });
});
