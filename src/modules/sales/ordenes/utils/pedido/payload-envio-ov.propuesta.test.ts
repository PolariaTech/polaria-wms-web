import { describe, expect, it } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { parseLineasParaEnvio } from "./payload-envio-ov";

function linea(partial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "p-elegido",
    nombre: "Aguacate Primera",
    codigo: "P",
    idBodega: "b1",
    cantidadInput: "2",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    descuentoPctInput: "",
    ivaPct: "0",
    kgDisponible: 10,
    unidadMedida: "kg",
    precioUnitario: 40,
    precioInput: "40",
    aliasCliente: "aguacate hass",
    ...partial,
  };
}

describe("parseLineasParaEnvio propuestaSistema", () => {
  it("escribe sugeridoMateo y fuente desde propuestaSistema", () => {
    const parsed = parseLineasParaEnvio({
      lineas: [
        linea({
          propuestaSistema: {
            producto: {
              idProducto: "p-propuesto",
              nombre: "Aguacate Extra",
              codigo: "E",
            },
            fuente: "difuso",
          },
        }),
      ],
      isDraft: true,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lineas[0]?.matchProducto).toEqual({
      textoCliente: "aguacate hass",
      sugeridoMateo: {
        idProducto: "p-propuesto",
        nombre: "Aguacate Extra",
        codigo: "E",
      },
      elegidoUsuario: {
        idProducto: "p-elegido",
        nombre: "Aguacate Primera",
        codigo: "P",
      },
      fuente: "difuso",
    });
  });

  it("línea sin propuestaSistema → matchProducto sin la clave fuente", () => {
    const parsed = parseLineasParaEnvio({
      lineas: [linea()],
      isDraft: true,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lineas[0]?.matchProducto?.sugeridoMateo).toBeNull();
    expect(parsed.lineas[0]?.matchProducto).not.toHaveProperty("fuente");
  });
});
