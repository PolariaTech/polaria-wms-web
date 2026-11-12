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
