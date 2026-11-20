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

describe("mapPedidoExtraidoToForm unidad (REQ-363)", () => {
  it("REQ-363: si el pedido pide KG y el catálogo es PZA, la línea queda en KGM", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "Coliflor Blanca (Sin Oxidacion)",
            productoCatalogo: "COLIFLOR (105001501)",
            cantidad: 20,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: "Sin Oxidacion",
            numeroPedido: null,
            almacen: null,
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: "105001501",
            responsableExterno: null,
            precioUnitario: 33,
          },
        ],
      },
      productos: [
        {
          idProducto: "col-1",
          label: "COLIFLOR (105001501)",
          idCliente: null,
          idBodega: "b1",
          codigo: "105001501",
          nombre: "COLIFLOR",
          kgDisponible: 100,
          precioUnitario: 33,
          unidadMedida: "PZA",
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
        correo: "",
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.unidadMedida).toBe("KGM");
    expect(mapped.lineas[0]?.especificacion).toMatch(/Sin Oxidacion/i);
    expect(mapped.lineas[0]?.especificacion).not.toMatch(/^KG\b/i);
  });
});
