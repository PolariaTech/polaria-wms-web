import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { buildMaterializeOvDesdeOrigenPlan } from "./materialize-ov-desde-origen";

const productos: ProductoVentaOption[] = [
  {
    idProducto: "p-limon",
    label: "LIMON PERSA (SIN SEMILLA) (115001400)",
    idCliente: null,
    idBodega: "b1",
    codigo: "115001400",
    nombre: "LIMON PERSA (SIN SEMILLA)",
    kgDisponible: 100,
    precioUnitario: 20,
    unidadMedida: "kg",
  },
];

const renglon = (extra: Record<string, unknown>) => ({
  Producto: "LIMON PERSA (SIN SEMILLA)",
  Cantidad: 5,
  Unidad: "KGS",
  "Codigo producto": "",
  ...extra,
});

describe("buildMaterializeOvDesdeOrigenPlan — especificación del origen (REQ-287)", () => {
  it("lleva la Especificacion del renglón a la línea", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [renglon({ Especificacion: "Sin semilla, empacado en bolsa" })],
      productos,
      compradores: [],
    });
    expect(plan.lineas).toHaveLength(1);
    expect(plan.lineas[0]?.especificacion).toBe("Sin semilla · empacado en bolsa");
  });

  it("control: sin Especificacion la línea queda como antes", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({ origenCorreo: [renglon({})], productos, compradores: [] });
    expect(plan.lineas[0]?.especificacion).toBe("");
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

const productoDomo = (
  id: string,
  codigo: string,
  nombre: string,
): ProductoVentaOption => ({
  idProducto: id,
  label: `${nombre} (${codigo})`,
  idCliente: null,
  idBodega: "b1",
  codigo,
  nombre,
  kgDisponible: 100,
  precioUnitario: 64,
  unidadMedida: "PZA",
});

describe("buildMaterializeOvDesdeOrigenPlan — paréntesis del renglón (REQ-323)", () => {
  const catalogo = [
    productoDomo("p-fresas", "10501527", "FRESAS (DOMO)"),
    productoDomo("p-frambuesas", "10501529", "FRAMBUESAS (DOMO)"),
  ];

  it("conserva el domo del renglón cuando Mateo lo omitió, junto a la Obs.", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Producto: "FRESAS (DOMO)",
          "Codigo producto": "10501527",
          Cantidad: 1,
          Unidad: "PZA",
        },
        {
          Producto: "FRAMBUESAS (DOMO)",
          "Codigo producto": "10501529",
          Cantidad: 1,
          Unidad: "PZA",
        },
      ],
      productos: catalogo,
      compradores: [],
      origenTexto: ORIGEN_OV_1980,
    });

    expect(plan.lineas).toHaveLength(2);
    expect(plan.lineas[0]?.especificacion).toContain("Domo de 1 kg");
    expect(plan.lineas[1]?.especificacion).toContain("Domo de 200g");
    expect(plan.lineas[1]?.especificacion).toContain("170 GRAMOS");
  });

  it("no duplica el domo si el renglón ya trae Especificacion", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Producto: "FRESAS (DOMO)",
          "Codigo producto": "10501527",
          Cantidad: 1,
          Unidad: "PZA",
        },
        {
          Producto: "FRAMBUESAS (DOMO)",
          "Codigo producto": "10501529",
          Cantidad: 1,
          Unidad: "PZA",
          Especificacion: "Domo de 200 g; 170 GRAMOS",
        },
      ],
      productos: catalogo,
      compradores: [],
      origenTexto: ORIGEN_OV_1980,
    });

    const especFrambuesas = plan.lineas[1]?.especificacion ?? "";
    expect((especFrambuesas.match(/Domo de 200\s*g/gi) ?? []).length).toBe(1);
    expect(especFrambuesas).toContain("170 GRAMOS");
  });
});

