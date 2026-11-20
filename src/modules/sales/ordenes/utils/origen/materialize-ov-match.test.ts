import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { indiceFrasesCliente } from "../match/frase-cliente";
import {
  compradorDesdeOrigen,
  resolveProductoForRenglon,
  valorMasFrecuente,
} from "./materialize-ov-match";

const limon: ProductoVentaOption = {
  idProducto: "p-limon",
  label: "LIMON PERSA (115001400)",
  idCliente: null,
  idBodega: "b1",
  codigo: "115001400",
  nombre: "LIMON PERSA",
  kgDisponible: 100,
  precioUnitario: 20,
  unidadMedida: "kg",
};

describe("materialize-ov-match", () => {
  it("valorMasFrecuente elige el más repetido", () => {
    expect(valorMasFrecuente(["A", "B", "A"])).toBe("A");
    expect(valorMasFrecuente(["", "  "])).toBeNull();
  });

  it("resolveProductoForRenglon matchea por código", () => {
    const productos = [limon];
    const found = resolveProductoForRenglon(
      {
        Producto: "Limon",
        "Codigo producto": "115001400",
        Cantidad: 1,
      },
      productos,
      indiceFrasesCliente(productos),
    );
    expect(found?.producto.idProducto).toBe("p-limon");
    expect(found?.fuente).toBe("codigo");
  });

  it("compradorDesdeOrigen auto-asigna si el nombre es claro", () => {
    const id = compradorDesdeOrigen({
      origenCorreo: [
        {
          Producto: "X",
          Cantidad: 1,
          "Nombre cliente": "Fairmont Mayakoba",
        },
      ],
      compradores: [
        {
          idComprador: "c-fair",
          codigo: "FAIR01",
          comprador: "Fairmont Mayakoba",
          telefono: null,
          rfc: "",
          grupo: "",
          estaActivo: true,
        },
      ],
    });
    expect(id).toBe("c-fair");
  });
});
