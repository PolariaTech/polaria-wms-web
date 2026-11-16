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
      "Madurez: Amarillo · Firme",
      null,
      "Madurez: Amarillo · Macizo por favor es para picar para ceviches",
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
      { producto: "Aguacate Hass", madurez: "Madurez: Pintón" },
      { producto: "Jitomate Saladet", madurez: "Madurez: Rojo" },
      { producto: "Plátano", madurez: "Madurez: Enrriado" },
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

const ORIGEN_OV_1980 = [
  "1. FRESAS (DOMO) (Domo de 1 kg) [Cód. 10501527] · 1 domo · $215.00/domo · $215.00",
  " Facturar: 1 kg · $215.00/kg · Cód. 105001503",
  "2. FRAMBUESAS (DOMO) (Domo de 200 g) [Cód. 10501529] · 1 domo · $64.00/domo · $64.00",
  " Facturar: 0.2 kg · $320.00/kg · Cód. 105001506",
  " Obs.: 170 GRAMOS",
  "3. ARÁNDANOS/BLUEBERRIES (DOMO) (Domo de 200 g) [Cód. 10501528] · 1 domo · $64.00/domo · $64.00",
  "4. ZARZAMORA (DOMO) (Domo de 170 g) [Cód. 10501531] · 1 domo · $70.00/domo · $70.00",
  "5. APIO [Cód. 105001554] · 1 pza · $18.00/pza · $18.00",
  " Obs.: 1 PZA LO QUE PESE",
  "6. BROCOLI [Cód. 105001500] · 2 kg · $33.00/kg · $66.00",
  "7. PEPINO [Cód. 10501519] · 4 kg · $25.00/kg · $100.00",
  "8. LIMON PERSA [Cód. 115001400] · 5 kg · $20.00/kg · $100.00",
  "9. JITOMATE GUAJE [Cód. 10501518] · 25 kg · $39.00/kg · Madurez: Amarillo · $975.00",
  "10. CEBOLLA BLANCA [Cód. 105001510] · 3 kg · $12.00/kg · $36.00",
  "11. ELOTE [Cód. 105001552] · 4 pza · $17.00/pza · $68.00",
  "12. PIÑA [Cód. 105001508] · 2 pza · $26.00/pza · $52.00",
].join("\n");

describe("asignarMadurezAProductos con paréntesis del renglón (REQ-323)", () => {
  it("suma el domo del renglón y conserva Obs. y madurez", () => {
    const niveles = asignarMadurezAProductos({
      productos: [
        "FRESAS (DOMO)",
        "FRAMBUESAS (DOMO)",
        "APIO",
        "JITOMATE GUAJE",
      ],
      textoFuente: ORIGEN_OV_1980,
    });

    expect(niveles[0]).toBe("Domo de 1 kg");
    expect(niveles[1]).toBe("Domo de 200g · 170 GRAMOS");
    expect(niveles[2]).toBe("1 PZA LO QUE PESE");
    expect(niveles[3]).toBe("Madurez: Amarillo");
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
      "Madurez: Pintón",
      "Madurez: Rojo",
      null,
      "Madurez: Maduro",
    ]);
  });
});
