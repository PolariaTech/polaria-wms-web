import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
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
  {
    idProducto: "p-brocoli",
    label: "BROCOLI (105001500)",
    idCliente: null,
    idBodega: "b1",
    codigo: "105001500",
    nombre: "BROCOLI",
    kgDisponible: 50,
    precioUnitario: 33,
    unidadMedida: "kg",
  },
];

const compradores: CompradorListRow[] = [
  {
    idComprador: "c-ejemplo",
    codigo: "EJE01",
    comprador: "Hotel Ejemplo Cancún",
    apodo: "",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
  },
];

describe("buildMaterializeOvDesdeOrigenPlan — renglón sin match y cantidad 0", () => {
  it("omite cantidad 0, anota el sin match y materializa el renglón válido", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Fecha: "2026-11-12",
          Precio: 20,
          Cantidad: 5,
          Producto: "CEBOLLA BLANCA KG",
          "Numero pedido": "OC-EJEMPLO-001",
          "Nombre cliente": "Hotel Ejemplo Cancún",
        },
        {
          Fecha: "2026-11-12",
          Precio: 23,
          Cantidad: 0,
          Producto: "Limon persa *",
          "Numero pedido": "OC-EJEMPLO-001",
          "Nombre cliente": "Hotel Ejemplo Cancún",
        },
        {
          Fecha: "2026-11-12",
          Precio: 33,
          Cantidad: 10,
          Producto: "BROCOLI",
          "Numero pedido": "OC-EJEMPLO-001",
          "Nombre cliente": "Hotel Ejemplo Cancún",
          Almacen: "Cocina",
        },
      ],
      productos,
      compradores,
    });

    expect(plan).toMatchSnapshot();
  });
});
