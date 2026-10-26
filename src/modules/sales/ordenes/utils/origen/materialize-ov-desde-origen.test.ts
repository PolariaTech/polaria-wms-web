import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import {
  buildMaterializeOvDesdeOrigenPlan,
  parseFechaOrigen,
  resolveFechaEntregaDesdeOrigen,
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
  {
    idProducto: "p-jugo",
    label: "JUGO DE LIMON (105001548)",
    idCliente: null,
    idBodega: "b1",
    codigo: "105001548",
    nombre: "JUGO DE LIMON",
    kgDisponible: 80,
    precioUnitario: 70,
    unidadMedida: "LTR",
  },
];

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

describe("materialize-ov-desde-origen", () => {
  it("parsea fechas del tercero", () => {
    expect(parseFechaOrigen("2026-09-10")).toBe("2026-09-10");
    expect(parseFechaOrigen("2026-10-06 16:01:52")).toBe("2026-10-06");
  });

  it("resuelve MM/DD BirchStreet sin inventar mes 24", () => {
    expect(parseFechaOrigen("10/24/2026")).toBe("2026-10-24");
    expect(parseFechaOrigen("Delivery date: 10/24/2026")).toBe("2026-10-24");
    expect(parseFechaOrigen("FECHA DE ENTREGA : 10/26/2026")).toBe(
      "2026-10-26",
    );
    expect(parseFechaOrigen("21/10/2026")).toBe("2026-10-21");
    expect(parseFechaOrigen("10/05/2026")).toBe("2026-05-10");
  });

  it("resolveFechaEntregaDesdeOrigen prioriza OT y luego Fecha del origen (REQ-110)", () => {
    expect(
      resolveFechaEntregaDesdeOrigen({
        origenCorreo: [
          {
            Fecha: "10/26/2026",
            Producto: "X",
            Cantidad: 1,
          } as never,
        ],
        hijas: [],
      }),
    ).toBe("2026-10-26");
    expect(
      resolveFechaEntregaDesdeOrigen({
        origenCorreo: [
          {
            Fecha: "10/26/2026",
            Producto: "X",
            Cantidad: 1,
          } as never,
        ],
        hijas: [{ fecha: "2026-10-28" }],
      }),
    ).toBe("2026-10-28");
    expect(
      resolveFechaEntregaDesdeOrigen({
        origenCorreo: [
          { Fecha: "", Producto: "X", Cantidad: 1 } as never,
        ],
        hijas: [],
      }),
    ).toBeNull();
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
    expect(plan.lineas[0]?.unidadMedida).toBe("kg");
    expect(plan.lineas[0]?.especificacion).toBe("");
    expect(plan.lineas[1]?.idProducto).toBe("p-brocoli");
  });

  it("REQ-115: no materializa cebolla como aguacate", () => {
    const conAguacate: ProductoVentaOption[] = [
      ...productos,
      {
        idProducto: "p-aguacate",
        label: "AGUACATE HASS EXTRA (115001005)",
        idCliente: null,
        idBodega: "b1",
        codigo: "115001005",
        nombre: "AGUACATE HASS EXTRA",
        kgDisponible: 40,
        precioUnitario: 90,
        unidadMedida: "kg",
      },
    ];
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Fecha: "2026-10-21",
          Precio: 20,
          Cantidad: 5,
          Producto: "CEBOLLA BLANCA KG",
          "Numero pedido": "OV-TEST",
          "Nombre cliente": "Fairmont Mayakoba",
        },
      ],
      productos: conAguacate,
      compradores,
    });
    expect(plan.lineas).toHaveLength(0);
    expect(plan.sinMatchProductos).toContain("CEBOLLA BLANCA KG");
  });

  it("REQ-124: galón de 5 L → cantidad LTR + especificación", () => {
    const plan = buildMaterializeOvDesdeOrigenPlan({
      origenCorreo: [
        {
          Fecha: "2026-10-21",
          Precio: 350,
          Cantidad: 2,
          Producto: "Jugo de Limón fresco galón de 5 litros",
          "Numero pedido": "OV-TEST",
          "Nombre cliente": "Fairmont Mayakoba",
          Almacen: "Cocina",
        },
      ],
      productos,
      compradores,
    });

    expect(plan.lineas).toHaveLength(1);
    expect(plan.lineas[0]?.idProducto).toBe("p-jugo");
    expect(plan.lineas[0]?.cantidadPedida).toBe(10);
    expect(plan.lineas[0]?.precioUnitario).toBe(70);
    expect(plan.lineas[0]?.especificacion).toBe("2x galón de 5 litros");
  });
});
