import { describe, expect, it } from "vitest";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../shared/types/sales.types";
import type { LineaVentaFromIa } from "../utils/pedido/map-pedido-extraido-to-form";
import {
  construirAvisosPedidoIa,
  construirMissingFieldsPedidoIa,
  mapLineasPedidoIaAForm,
  resolverTextoOrigenParaPersistir,
} from "./useOtOv-helpers";

describe("useOtOv-helpers", () => {
  describe("construirMissingFieldsPedidoIa", () => {
    it("agrega cliente y direccion cuando faltan", () => {
      const result = construirMissingFieldsPedidoIa({
        baseMissingFields: ["fechaEntrega"],
        tieneCliente: false,
        direccion: "   ",
      });
      expect(Array.from(result)).toEqual([
        "fechaEntrega",
        "cliente",
        "direccion",
      ]);
    });

    it("elimina cliente y direccion cuando están presentes", () => {
      const result = construirMissingFieldsPedidoIa({
        baseMissingFields: ["cliente", "direccion", "anden"],
        tieneCliente: true,
        direccion: "Av. Reforma 123",
      });
      expect(Array.from(result)).toEqual(["anden"]);
    });
  });

  describe("mapLineasPedidoIaAForm", () => {
    it("mapea una línea IA asignando defaults de iva, unidad y sugerencias", () => {
      const lineaIa: LineaVentaFromIa = {
        idProducto: "prod-1",
        nombre: "Tomate Saladette",
        codigo: "TOM-01",
        idBodega: "bod-1",
        cantidadInput: "10",
        cajasInput: "2",
        presentacion: "Caja",
        especificacion: "Maduro",
        kgDisponible: 50,
        unidadMedida: "",
        precioUnitario: 25.5,
        precioManual: false,
        aliasCliente: "Tomate rojo",
        filledByIa: true,
        otId: "ot-1",
        catalogPending: false,
        catalogAmbiguo: false,
      };

      const [mapped] = mapLineasPedidoIaAForm([lineaIa]);
      expect(mapped).toMatchObject({
        idProducto: "prod-1",
        ivaPct: "0",
        unidadMedida: UNIDAD_MEDIDA_VENTA_DEFAULT,
        precioInput: "25.5",
        sugerencia: null,
        sugerenciasAlternativas: [],
      });
    });
  });

  describe("construirAvisosPedidoIa", () => {
    it("reporta advertencia, archivos no legibles, productos pendientes y cliente faltante con sugerencia", () => {
      const avisos = construirAvisosPedidoIa({
        advertencia: "Formato incompleto.",
        archivosNoLegibles: ["anexo.bin"],
        lineas: [{ catalogPending: true }, { catalogPending: false }],
        tieneCliente: false,
        nombreCliente: "Hotel Sol",
        cantidadSugeridos: 2,
      });

      expect(avisos).toEqual([
        "Formato incompleto.",
        "No se pudieron leer: anexo.bin. Se guardan como respaldo.",
        "1 producto no identificado.",
        "El cliente «Hotel Sol» no coincide exacto: revisa la sugerencia o elige otro.",
      ]);
    });

    it("reporta ausencia de productos y cliente no encontrado sin sugerencias", () => {
      const avisos = construirAvisosPedidoIa({
        advertencia: null,
        archivosNoLegibles: [],
        lineas: [],
        tieneCliente: false,
        nombreCliente: "Desconocido SA",
        cantidadSugeridos: 0,
      });

      expect(avisos).toEqual([
        "No se reconocieron productos del pedido. Revisa el mensaje y agrégalos a mano.",
        "El cliente «Desconocido SA» no está en clientes. Selecciónalo para continuar.",
      ]);
    });

    it("reporta plural para múltiples productos no identificados y solicitud genérica de cliente", () => {
      const avisos = construirAvisosPedidoIa({
        archivosNoLegibles: [],
        lineas: [{ catalogPending: true }, { catalogPending: true }],
        tieneCliente: false,
        nombreCliente: "   ",
        cantidadSugeridos: 0,
      });

      expect(avisos).toEqual([
        "2 productos no identificados.",
        "Selecciona el cliente para continuar.",
      ]);
    });
  });

  describe("resolverTextoOrigenParaPersistir", () => {
    it("prioriza el textoOrigen que devolvió el pedido IA", () => {
      expect(
        resolverTextoOrigenParaPersistir("  Texto IA  ", "Texto local"),
      ).toBe("Texto IA");
    });

    it("devuelve cadena vacía si ambos textos están vacíos", () => {
      expect(resolverTextoOrigenParaPersistir(null, "   ")).toBe("");
    });

    it("conserva el texto local limpio cuando no viene textoOrigen del pedido", () => {
      expect(
        resolverTextoOrigenParaPersistir(undefined, "Entregar temprano por puerta 2"),
      ).toBe("Entregar temprano por puerta 2");
    });
  });
});
