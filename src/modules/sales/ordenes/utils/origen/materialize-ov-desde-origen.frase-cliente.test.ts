import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { buildMaterializeOvDesdeOrigenPlan } from "./materialize-ov-desde-origen";

function productoVenta(
  parcial: Pick<ProductoVentaOption, "idProducto" | "codigo" | "nombre"> & {
    frasesCliente?: readonly string[];
  },
): ProductoVentaOption {
  return {
    label: `${parcial.nombre} (${parcial.codigo})`,
    idCliente: null,
    idBodega: "b1",
    kgDisponible: 40,
    precioUnitario: 20,
    unidadMedida: "kg",
    ...parcial,
  };
}

const GRANNY = productoVenta({
  idProducto: "p-granny",
  codigo: "115001010",
  nombre: "MANZANA GRANNY SMITH",
  frasesCliente: ["Manzana verde"],
});
const AJO = productoVenta({
  idProducto: "p-ajo",
  codigo: "115001201",
  nombre: "AJO",
});
const EXTRA = productoVenta({
  idProducto: "p-aguacate-extra",
  codigo: "115001005",
  nombre: "AGUACATE EXTRA",
});
const PRIMERA = productoVenta({
  idProducto: "p-aguacate-primera",
  codigo: "115001009",
  nombre: "AGUACATE PRIMERA",
  frasesCliente: ["aguacate hass"],
});

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

function planDe(producto: string, productos: ProductoVentaOption[], extra: Record<string, unknown> = {}) {
  return buildMaterializeOvDesdeOrigenPlan({
    origenCorreo: [
      {
        Fecha: "2026-09-10",
        Precio: 20,
        Cantidad: 5,
        Producto: producto,
        "Numero pedido": "MYK-1",
        "Nombre cliente": "Fairmont Mayakoba",
        ...extra,
      },
    ],
    productos,
    compradores,
  });
}

describe("materialize-ov-desde-origen por frase del cliente", () => {
  it("CA1: Manzana verde con la frase queda asignada a GRANNY SMITH", () => {
    const plan = planDe("Manzana verde", [GRANNY, AJO]);
    expect(plan.lineas).toHaveLength(1);
    expect(plan.lineas[0]?.idProducto).toBe("p-granny");
    expect(plan.lineas[0]?.matchProducto.fuente).toBe("frase");
    expect(plan.lineas[0]?.matchProducto.sugeridoMateo?.idProducto).toBe(
      "p-granny",
    );
  });

  it("CA2: el mismo texto sin frase no asigna por equivalencia", () => {
    const grannySinFrase = { ...GRANNY, frasesCliente: undefined };
    const planHoy = planDe("Manzana verde", [grannySinFrase, AJO]);
    expect(planHoy.lineas[0]?.matchProducto.fuente).not.toBe("frase");

    const grannyPedido = {
      ...GRANNY,
      frasesCliente: ["pedido especial hotel"],
    };
    const sinFrase = planDe("pedido especial hotel", [
      { ...grannyPedido, frasesCliente: undefined },
      AJO,
    ]);
    expect(sinFrase.lineas).toHaveLength(0);
  });

  it("CA3: una frase ambigua no asigna nada", () => {
    const extraConFrase = { ...EXTRA, frasesCliente: ["Manzana verde"] };
    const plan = planDe("Manzana verde", [GRANNY, extraConFrase]);
    expect(plan.lineas).toHaveLength(0);
    expect(plan.sinMatchProductos).toContain("Manzana verde");
  });

  it("un código único que contradice la frase manda el código", () => {
    const plan = planDe("aguacate hass", [EXTRA, PRIMERA], {
      "Codigo producto": "115001005",
    });
    expect(plan.lineas[0]?.idProducto).toBe("p-aguacate-extra");
    expect(plan.lineas[0]?.matchProducto.fuente).toBe("codigo");
  });
});
