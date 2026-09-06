import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";

const emptyPedido = (): PedidoExtraido => ({
  fechaEntrega: "2026-09-07",
  centroConsumo: null,
  observaciones: null,
  rfc: null,
  regimen: null,
  direccion: null,
  anden: null,
  contacto: null,
  telefono: null,
  horarioDesde: null,
  horarioHasta: null,
  tolerancia: null,
  sustituciones: null,
  lote: null,
  temperatura: null,
  lineas: [],
  advertencia: null,
  archivosNoLegibles: [],
});

describe("mapPedidoExtraidoToForm", () => {
  it("prefiere el pedido cuando difiere de la ficha y marca warn", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        anden: "Andén 5",
        horarioDesde: "07:00",
      },
      productos: [],
      ficha: {
        centroConsumo: "Cocina",
        ventanaDesde: "06:00",
        ventanaHasta: "10:00",
        direccion: "Calle 1",
        anden: "Andén 1",
        contacto: "Ana",
        telefono: "555",
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
    });

    expect(mapped.anden).toBe("Andén 5");
    expect(mapped.ventanaDesde).toBe("07:00");
    expect(mapped.warnFields.has("anden")).toBe(true);
    expect(mapped.discrepancias.some((d) => d.campo === "Andén")).toBe(true);
  });

  it("mapea líneas por clave de catálogo", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "aguacate",
            productoCatalogo: "Aguacate Hass (SKU-1)",
            cantidad: 40,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: "firme",
          },
        ],
      },
      productos: [
        {
          idProducto: "p1",
          label: "Aguacate Hass (SKU-1)",
          idCliente: null,
          idBodega: "b1",
          codigo: "SKU-1",
          nombre: "Aguacate Hass",
          kgDisponible: 100,
          precioUnitario: 50,
        },
      ],
      ficha: {
        centroConsumo: "",
        ventanaDesde: "",
        ventanaHasta: "",
        direccion: "",
        anden: "",
        contacto: "",
        telefono: "",
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
    });

    expect(mapped.lineas).toHaveLength(1);
    expect(mapped.lineas[0]?.idProducto).toBe("p1");
    expect(mapped.lineas[0]?.cantidadInput).toBe("40");
    expect(mapped.lineas[0]?.aliasCliente).toBe("aguacate");
  });
});
