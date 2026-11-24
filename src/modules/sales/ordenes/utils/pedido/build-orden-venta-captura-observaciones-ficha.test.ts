import { describe, expect, it } from "vitest";
import {
  buildOrdenVentaCapturaObservaciones,
  parseOrdenVentaCapturaObservaciones,
  type OrdenVentaCapturaExtra,
} from "./build-orden-venta-captura-observaciones-ficha";

const EMPTY: OrdenVentaCapturaExtra = {
  fechaEntrega: "",
  ventanaDesde: "",
  ventanaHasta: "",
  prioridad: "Normal",
  ordenCompraHotel: "",
  centroConsumo: "",
  vendedor: "",
  observaciones: "",
  moneda: "",
  bodegaDestino: "",
  direccion: "",
  anden: "",
  contacto: "",
  telefono: "",
  correo: "",
  turno: "",
  horaSalida: "",
  chofer: "",
  unidad: "",
  aceptaSustituciones: "",
  requiereLote: "",
  registrarTemperatura: "",
  origenTexto: "",
  origenArchivos: [],
  notasLineas: "",
};

describe("build-orden-venta-captura-observaciones-ficha", () => {
  it("arma y parsea observaciones de captura", () => {
  const extra = { ...EMPTY, observaciones: "Entrega temprano" };
    const text = buildOrdenVentaCapturaObservaciones(extra);
    expect(parseOrdenVentaCapturaObservaciones(text).observaciones).toBe(
      "Entrega temprano",
    );
  });
});