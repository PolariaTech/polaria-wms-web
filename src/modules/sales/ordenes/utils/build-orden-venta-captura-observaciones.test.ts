import { describe, expect, it } from "vitest";
import {
  buildOrdenVentaCapturaObservaciones,
  formatCapturaFecha,
  isAfterWarehouseCutoff,
  notaCapturaForProducto,
  parseOrdenVentaCapturaObservaciones,
  tomorrowIsoDate,
  type OrdenVentaCapturaExtra,
} from "./build-orden-venta-captura-observaciones";

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

describe("buildOrdenVentaCapturaObservaciones", () => {
  it("devuelve null si no hay nada que persistir", () => {
    expect(buildOrdenVentaCapturaObservaciones(EMPTY)).toBeNull();
  });

  it("junta pedido original, datos de captura y notas", () => {
    const text = buildOrdenVentaCapturaObservaciones({
      ...EMPTY,
      origenTexto: "40 kg de fresa",
      origenArchivos: ["pedido.pdf"],
      fechaEntrega: "2026-09-03",
      ventanaDesde: "06:00",
      ventanaHasta: "09:00",
      prioridad: "Urgente",
      observaciones: "Entrega temprano",
    });

    expect(text).toContain("Pedido original:\n40 kg de fresa");
    expect(text).toContain("Archivos: pedido.pdf");
    expect(text).toContain("Fecha de entrega: 2026-09-03");
    expect(text).toContain("Ventana de entrega: 06:00 – 09:00");
    expect(text).toContain("Prioridad: Urgente");
    expect(text).toContain("Entrega temprano");
    expect(text).not.toContain("Prioridad: Normal");
  });

  it("incluye notas de líneas cuando vienen informadas", () => {
    const text = buildOrdenVentaCapturaObservaciones({
      ...EMPTY,
      notasLineas: "Fresa: Firme — se usa el jueves",
    });
    expect(text).toBe("Fresa: Firme — se usa el jueves");
  });
});

describe("tomorrowIsoDate", () => {
  it("devuelve el día siguiente en ISO local", () => {
    expect(tomorrowIsoDate(new Date(2026, 8, 2, 10, 0, 0))).toBe("2026-09-03");
  });
});

describe("isAfterWarehouseCutoff", () => {
  it("marca corte después de las 17:00 y antes de las 02:00", () => {
    expect(isAfterWarehouseCutoff(new Date(2026, 8, 2, 17, 0, 0))).toBe(true);
    expect(isAfterWarehouseCutoff(new Date(2026, 8, 2, 1, 30, 0))).toBe(true);
    expect(isAfterWarehouseCutoff(new Date(2026, 8, 2, 10, 0, 0))).toBe(false);
  });
});

describe("parseOrdenVentaCapturaObservaciones", () => {
  it("recupera los campos de captura del texto persistido", () => {
    const extra: OrdenVentaCapturaExtra = {
      ...EMPTY,
      origenTexto: "40 kg de fresa",
      origenArchivos: ["pedido.pdf"],
      fechaEntrega: "2026-09-03",
      ventanaDesde: "06:00",
      ventanaHasta: "09:00",
      prioridad: "Urgente",
      ordenCompraHotel: "OC-88",
      centroConsumo: "Cocina de banquetes",
      vendedor: "Ana Pérez",
      moneda: "USD",
      bodegaDestino: "Bodega central (BOD-01)",
      direccion: "Km 282",
      anden: "Andén 3",
      contacto: "Chef Uc",
      telefono: "998 000 0000",
      turno: "PM",
      horaSalida: "04:30",
      chofer: "Luis",
      unidad: "Camión 2",
      aceptaSustituciones: "Sí, con aviso",
      requiereLote: "Sí",
      registrarTemperatura: "No",
      notasLineas: "Fresa: Firme — se usa el jueves",
      observaciones: "Entrega temprano",
    };

    const parsed = parseOrdenVentaCapturaObservaciones(
      buildOrdenVentaCapturaObservaciones(extra),
    );

    expect(parsed.origenTexto).toBe("40 kg de fresa");
    expect(parsed.origenArchivos).toEqual(["pedido.pdf"]);
    expect(parsed.fechaEntrega).toBe("2026-09-03");
    expect(parsed.ventanaEntrega).toBe("06:00 – 09:00");
    expect(parsed.prioridad).toBe("Urgente");
    expect(parsed.ordenCompraHotel).toBe("OC-88");
    expect(parsed.centroConsumo).toBe("Cocina de banquetes");
    expect(parsed.vendedor).toBe("Ana Pérez");
    expect(parsed.moneda).toBe("USD");
    expect(parsed.bodegaDestino).toBe("Bodega central (BOD-01)");
    expect(parsed.direccion).toBe("Km 282");
    expect(parsed.anden).toBe("Andén 3");
    expect(parsed.contacto).toBe("Chef Uc");
    expect(parsed.telefono).toBe("998 000 0000");
    expect(parsed.turno).toBe("PM");
    expect(parsed.horaSalida).toBe("04:30");
    expect(parsed.chofer).toBe("Luis");
    expect(parsed.unidad).toBe("Camión 2");
    expect(parsed.aceptaSustituciones).toBe("Sí, con aviso");
    expect(parsed.requiereLote).toBe("Sí");
    expect(parsed.registrarTemperatura).toBe("No");
    expect(parsed.notasLineas).toBe("Fresa: Firme — se usa el jueves");
    expect(parsed.observaciones).toBe("Entrega temprano");
  });

  it("deja el texto libre como observaciones si no hay ficha de captura", () => {
    const parsed = parseOrdenVentaCapturaObservaciones("Nota vieja del pedido");
    expect(parsed.observaciones).toBe("Nota vieja del pedido");
    expect(parsed.fechaEntrega).toBe("");
    expect(parsed.centroConsumo).toBe("");
  });

  it("formatea fecha ISO y nota de línea por producto", () => {
    expect(formatCapturaFecha("2026-09-03")).toBe("03/09/2026");
    expect(
      notaCapturaForProducto("Fresa: Firme · 2 cajas", "Fresa"),
    ).toBe("Firme · 2 cajas");
  });
});
