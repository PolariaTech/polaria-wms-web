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

describe("mapPedidoExtraidoToForm unidad (REQ-380)", () => {
  it("si el pedido pide KG y el catálogo es PZA, la línea queda en PZA", () => {
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

    expect(mapped.lineas[0]?.unidadMedida).toBe("PZA");
    expect(mapped.lineas[0]?.especificacion).toMatch(/Sin Oxidacion/i);
    expect(mapped.lineas[0]?.especificacion).toMatch(/Pedido en KGM/i);
  });

  it("REQ-380: PZA del correo con catálogo KGM → unidad KGM y Pedido en PZA", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "Plátano macho",
            productoCatalogo: "PLATANO MACHO (105001500)",
            cantidad: 4,
            unidad: "PZA",
            cajas: null,
            presentacion: null,
            especificacion: null,
            numeroPedido: null,
            almacen: null,
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: "105001500",
            responsableExterno: null,
            precioUnitario: 10,
          },
        ],
      },
      productos: [
        {
          idProducto: "plat-1",
          label: "PLATANO MACHO (105001500)",
          idCliente: null,
          idBodega: "b1",
          codigo: "105001500",
          nombre: "PLATANO MACHO",
          kgDisponible: 50,
          precioUnitario: 10,
          unidadMedida: "KGM",
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
    expect(mapped.lineas[0]?.especificacion).toMatch(/Pedido en PZA/i);
  });
});
