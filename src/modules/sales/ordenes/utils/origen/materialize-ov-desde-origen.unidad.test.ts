import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { buildMaterializeOvDesdeOrigenPlan } from "./materialize-ov-desde-origen";

const compradores: CompradorListRow[] = [
  {
    idComprador: "c-fair",
    codigo: "FAIR01",
    comprador: "Fairmont Mayakoba",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
  },
];

describe("buildMaterializeOvDesdeOrigenPlan — unidad (REQ-363)", () => {
  it("si la OC pide KG y el catálogo es PZA, materializa KGM", () => {
    const productos: ProductoVentaOption[] = [
      {
        idProducto: "p-coliflor",
        label: "COLIFLOR (105001501)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001501",
        nombre: "COLIFLOR",
        kgDisponible: 30,
        precioUnitario: 33,
        unidadMedida: "PZA",
      },
    ];
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Fecha: "2026-11-20",
          Precio: 33,
          Unidad: "KG",
          Cantidad: 20,
          Producto: "Coliflor Blanca (Sin Oxidacion)",
          "Codigo producto": "105001501",
          "Numero pedido": "CUNQR0076609",
          "Nombre cliente": "Fairmont Mayakoba",
        },
      ],
      productos,
      compradores,
    });
    expect(plan.lineas).toHaveLength(1);
    expect(plan.lineas[0]?.idProducto).toBe("p-coliflor");
    expect(plan.lineas[0]?.unidadMedida).toBe("KGM");
  });
});
