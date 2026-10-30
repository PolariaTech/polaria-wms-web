import { describe, expect, it } from "vitest";
import {
  aplicarMadurezDesdeTexto,
  asignarMadurezAProductos,
  filasMadurezDesdeTexto,
  observacionesDesdeTexto,
} from "./madurez-linea";

const CORREO_ADP = [
  "PRODUCTOS",
  "1. AGUACATE EXTRA (200 a 260g) [Cód. 115001005] · 3 kg · $47.00/kg · Madurez: Amarillo · $141.00",
  "   Obs.: Firme",
  "2. PEPINO VERDE [Cód. 10501519] · 4 kg · $25.00/kg · $100.00",
  "3. JITOMATE GUAJE [Cód. 10501518] · 7 kg · $37.00/kg · Madurez: Amarillo · $259.00",
  "   Obs.: Macizo por favor  es para picar para ceviches",
  "",
  "TOTAL: $500.00",
].join("\n");

describe("observacionesDesdeTexto (REQ-231)", () => {
  it("ata cada «Obs.:» al producto numerado que la antecede", () => {
    expect(observacionesDesdeTexto(CORREO_ADP)).toEqual([
      { producto: "AGUACATE EXTRA (200 a 260g)", observacion: "Firme" },
      {
        producto: "JITOMATE GUAJE",
        observacion: "Macizo por favor es para picar para ceviches",
      },
    ]);
  });

  it("ignora un «Obs.:» que no sigue a un producto", () => {
    expect(observacionesDesdeTexto("Obs.: llamar antes de entregar")).toEqual([]);
  });
});

describe("asignarMadurezAProductos con Obs. (REQ-231)", () => {
  it("junta la madurez y la observación de cada producto", () => {
    expect(
      asignarMadurezAProductos({
        productos: ["AGUACATE EXTRA (200 a 260g)", "PEPINO VERDE", "JITOMATE GUAJE"],
        textoFuente: CORREO_ADP,
      }),
    ).toEqual([
      "Amarillo · Firme",
      null,
      "Amarillo · Macizo por favor es para picar para ceviches",
    ]);
  });
});

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
