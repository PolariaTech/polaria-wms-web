import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import {
  buildMaterializeOvDesdeOrigenPlan,
  parseFechaOrigen,
} from "./materialize-ov-desde-origen";

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
    idComprador: "c-fair",
    codigo: "FAIR01",
    comprador: "Fairmont Mayakoba",
    telefono: null,
    grupo: "",
    estaActivo: true,
  },
];

describe("materialize-ov-desde-origen", () => {
  it("parsea fechas del tercero", () => {
    expect(parseFechaOrigen("2026-09-10")).toBe("2026-09-10");
    expect(parseFechaOrigen("2026-10-06 16:01:52")).toBe("2026-10-06");
  });

  it("arma cabecera y líneas desde origen_correo", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Fecha: "2026-09-10",
          Precio: 23,
          Unidad: "KGM",
          Almacen: "AC01 Almacen Gener",
          Cantidad: 5,
          Producto: "Limon persa *",
          "Numero pedido": "MYK-0302085",
          "Nombre cliente": "Fairmont Mayakoba",
          "Responsable externo": "Alvaro Arellano",
        },
        {
          Fecha: "2026-09-10",
          Precio: 33,
          Cantidad: 10,
          Producto: "BROCOLI",
          "Numero pedido": "MYK-0302085",
          "Nombre cliente": "Fairmont Mayakoba",
          Almacen: "AC01 Almacen Gener",
          "Responsable externo": "Alvaro Arellano",
        },
      ],
      productos,
      compradores,
    });

    expect(plan.idComprador).toBe("c-fair");
    expect(plan.ordenCompraHotel).toBe("MYK-0302085");
    expect(plan.centroConsumo).toBe("AC01 Almacen Gener");
    expect(plan.contactoEntrega).toBe("Alvaro Arellano");
    expect(plan.fechaEntrega).toBe("2026-09-10");
    expect(plan.lineas.length).toBe(2);
    expect(plan.lineas[0]?.idProducto).toBe("p-limon");
    expect(plan.lineas[0]?.cantidadPedida).toBe(5);
    expect(plan.lineas[1]?.idProducto).toBe("p-brocoli");
  });
});
