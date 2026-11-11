import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";

const emptyPedido = (): PedidoExtraido => ({
  fechaEntrega: "2026-09-07",
  centroConsumo: null,
  observaciones: null,
  ordenCompraHotel: null,
  nombreCliente: null,
  rfc: null,
  regimen: null,
  direccion: null,
  anden: null,
  contacto: null,
  telefono: null,
  correo: null,
  horarioDesde: null,
  horarioHasta: null,
  tolerancia: null,
  sustituciones: null,
  lote: null,
  temperatura: null,
  lineas: [],
  origenCorreo: [],
  advertencia: null,
  archivosNoLegibles: [],
});

const fichaVacia = {
  centroConsumo: "",
  ventanaDesde: "",
  ventanaHasta: "",
  direccion: "",
  anden: "",
  contacto: "",
  telefono: "",
  correo: "",
  aceptaSustituciones: "",
  requiereLote: "",
  registrarTemperatura: "",
  observaciones: "",
};

describe("mapPedidoExtraidoToForm (REQ-299)", () => {
  it("Pepino + 115001005 no asigna ni sugiere AGUACATE", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "Pepino",
            productoCatalogo: null,
            cantidad: 10,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: null,
            numeroPedido: null,
            almacen: null,
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: "115001005",
            responsableExterno: null,
            precioUnitario: null,
          },
        ],
      },
      productos: [
        {
          idProducto: "p-aguacate-extra",
          label: "AGUACATE EXTRA (115001005)",
          idCliente: null,
          idBodega: "b1",
          codigo: "115001005",
          nombre: "AGUACATE EXTRA",
          kgDisponible: 40,
          precioUnitario: 90,
          unidadMedida: "kg",
        },
        {
          idProducto: "p-pepino",
          label: "PEPINO (115001300)",
          idCliente: null,
          idBodega: "b1",
          codigo: "115001300",
          nombre: "PEPINO",
          kgDisponible: 80,
          precioUnitario: 20,
          unidadMedida: "kg",
        },
      ],
      ficha: fichaVacia,
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.idProducto).not.toBe("p-aguacate-extra");
    expect(mapped.lineas[0]?.sugerencia?.idProducto).not.toBe(
      "p-aguacate-extra",
    );
    expect(
      mapped.lineas[0]?.sugerenciasAlternativas?.some(
        (sugerencia) => sugerencia.idProducto === "p-aguacate-extra",
      ),
    ).toBeFalsy();
  });
});
