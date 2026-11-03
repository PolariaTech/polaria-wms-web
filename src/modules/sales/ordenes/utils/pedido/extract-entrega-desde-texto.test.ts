import { describe, expect, it } from "vitest";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
  extraerHorarioDesdeTexto,
  normalizarHoraAHhMm,
  quitarContactoDeDireccion,
} from "./extract-entrega-desde-texto";
import { limpiarDireccionEntrega } from "./limpiar-direccion-birchstreet";

describe("normalizarHoraAHhMm", () => {
  it("convierte am/pm a 24h", () => {
    expect(normalizarHoraAHhMm("6", "00", "am")).toBe("06:00");
    expect(normalizarHoraAHhMm("6", "00", "pm")).toBe("18:00");
    expect(normalizarHoraAHhMm("12", "00", "am")).toBe("00:00");
    expect(normalizarHoraAHhMm("12", "30", "pm")).toBe("12:30");
  });
});

describe("extraerHorarioDesdeTexto", () => {
  it("lee hora única de entrega", () => {
    expect(
      extraerHorarioDesdeTexto("Hora de entrega 6:00 am\nFavor de confirmar"),
    ).toEqual({ horarioDesde: "06:00", horarioHasta: null });
  });

  it("lee rango 8:00 AM – 2:00 PM", () => {
    expect(
      extraerHorarioDesdeTexto(
        "Ventana de recepción: 8:00 AM – 2:00 PM en andén 3",
      ),
    ).toEqual({ horarioDesde: "08:00", horarioHasta: "14:00" });
  });

  it("lee de 8 a 14", () => {
    expect(extraerHorarioDesdeTexto("Entregar de 8 a 14 hrs")).toEqual({
      horarioDesde: "08:00",
      horarioHasta: "14:00",
    });
  });
});

describe("extractEntregaDesdeTexto", () => {
  it("prioriza fecha explícita dd/mm/aaaa cerca de entrega", () => {
    const got = extractEntregaDesdeTexto(
      "Propiedad: Fairmont\nFecha de entrega: 21/10/2026\nProductos...",
      "2026-10-16",
    );
    expect(got.fechaIso).toBe("2026-10-21");
    expect(got.fechaFrase).toMatch(/21\/10\/2026/);
  });

  it("lee Delivery date MM/DD BirchStreet", () => {
    const got = extractEntregaDesdeTexto(
      "From: bss_system@birchstreet.net\nDelivery date: 10/24/2026\nPO NUMBER: CUNHI0101274",
      "2026-10-22",
    );
    expect(got.fechaIso).toBe("2026-10-24");
  });

  it("REQ-119: Entrega: gana sobre Enviado/fecha del correo", () => {
    const got = extractEntregaDesdeTexto(
      [
        "Enviado: jueves, 22 de octubre de 2026 19:46",
        "Cliente: Restaurante Marbella",
        "Recibe: Luis Garrido",
        "Entrega: viernes, 23 de octubre de 2026",
        "Dirección: Puerto Juárez",
      ].join("\n"),
      "2026-10-22",
    );
    expect(got.fechaIso).toBe("2026-10-23");
    expect(got.fechaFrase).toMatch(/23 de octubre/i);
  });

  it("lee '27 DE AGOSTO DE 2026' y hora 6:00 am", () => {
    const got = extractEntregaDesdeTexto(
      [
        "Buenas tardes,",
        "Envío adjunto pedido para entregar el 27 DE AGOSTO DE 2026 en Parque Xcaret:",
        "Hora de entrega 6:00 am",
        "Favor de confirmar de recibido",
      ].join("\n"),
      "2026-08-20",
    );
    expect(got.fechaIso).toBe("2026-08-27");
    expect(got.horarioDesde).toBe("06:00");
  });

  it("no inventa fecha ni hora si el cuerpo no las trae", () => {
    const got = extractEntregaDesdeTexto(
      "Haga clic en el botón Responder para enviar un correo\nwww.accorlive.com",
      "2026-10-16",
    );
    expect(got.fechaIso).toBeNull();
    expect(got.horarioDesde).toBeNull();
    expect(got.horarioHasta).toBeNull();
  });
});

describe("extractDireccionShipToDesdeTexto", () => {
  it("prefiere Ship To sobre Bill To", () => {
    const texto = [
      "Bill To:",
      "CESAR HILTON",
      "Av. Reforma 222, Ciudad de México, CDMX",
      "",
      "Ship To:",
      "HOSPITALITY SERVICES MAYA, S.A. de C.V.",
      "Blvd. Kukulcan km 17, Cancún, Q. Roo",
      "",
      "Item Description",
    ].join("\n");
    expect(extractDireccionShipToDesdeTexto(texto)).toBe(
      "HOSPITALITY SERVICES MAYA, S.A. de C.V., Blvd. Kukulcan km 17, Cancún, Q. Roo",
    );
  });

  it("lee Deliver To en una sola línea", () => {
    expect(
      extractDireccionShipToDesdeTexto(
        "Deliver To: Parque Xcaret, Playa del Carmen, QR 77710\nQty: 10",
      ),
    ).toBe("Parque Xcaret, Playa del Carmen, QR 77710");
  });

  it("devuelve null si no hay bloque de entrega", () => {
    expect(
      extractDireccionShipToDesdeTexto("Bill To:\nCESAR HILTON\nCDMX"),
    ).toBeNull();
  });

  it("descarta fax y correo mezclados tras Enviar a (REQ-162)", () => {
    const texto = [
      "Enviar a: SLS Playa Mujeres",
      "Fax:",
      "Correo elec: ventas@aguacatesdepuebla.com;facturacion@aguacatesdepuebla.com",
      "Vialidad Paseo Mujeres Solar B",
      "SM 3 M1 L34 CP 77400",
      "Isla Mujeres, QR, 77400, MX",
    ].join("\n");
    expect(extractDireccionShipToDesdeTexto(texto)).toBe(
      "SLS Playa Mujeres, Vialidad Paseo Mujeres Solar B, SM 3 M1 L34 CP 77400, Isla Mujeres, QR, 77400, MX",
    );
  });

  it("descarta teléfono y correo en líneas propias", () => {
    const texto = [
      "Ship To:",
      "Hotel Maya",
      "Tel: 998 166 0605",
      "9981660605",
      "compras@hotelmaya.com",
      "Blvd. Kukulcan km 17, Cancún",
    ].join("\n");
    expect(extractDireccionShipToDesdeTexto(texto)).toBe(
      "Hotel Maya, Blvd. Kukulcan km 17, Cancún",
    );
  });

  it("devuelve null si tras la etiqueta solo hay un correo", () => {
    expect(
      extractDireccionShipToDesdeTexto("Enviar a: ventas@empresa.com\nQty: 3"),
    ).toBeNull();
  });

  it("REQ-239: quita Attn y Sent From del Ship To de BirchStreet", () => {
    const texto = [
      "Bill To: OPERADORA RR CARIBBEAN SA DE CV",
      "Ship To: Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO",
      "Kukulcan Km 17, Zona Hotelera",
      "CANCUN, ROO, 77500, MX",
      "Attn: Ixayana Cid",
      "Sent From: Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO",
      "Name: Ixayana Cid",
    ].join("\n");
    expect(extractDireccionShipToDesdeTexto(texto)).toBe(
      "Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO, Kukulcan Km 17, Zona Hotelera, CANCUN, ROO, 77500, MX",
    );
  });
});

describe("quitarContactoDeDireccion", () => {
  it("quita correos, fax y teléfonos entre comas", () => {
    expect(
      quitarContactoDeDireccion(
        "SLS Playa Mujeres, Fax:, Correo elec: ventas@a.com;fact@a.com, Isla Mujeres, QR",
      ),
    ).toBe("SLS Playa Mujeres, Isla Mujeres, QR");
  });

  it("deja intacta una dirección sin contacto", () => {
    expect(quitarContactoDeDireccion("Av. Kukulcan km 9, Cancún, QR 77500")).toBe(
      "Av. Kukulcan km 9, Cancún, QR 77500",
    );
  });

  it("devuelve null si solo queda contacto", () => {
    expect(quitarContactoDeDireccion("ventas@a.com")).toBeNull();
    expect(quitarContactoDeDireccion("Tel: 998 166 0605")).toBeNull();
    expect(quitarContactoDeDireccion(null)).toBeNull();
  });

  it("REQ-239: también corta ATTN y FROM pegados a la dirección", () => {
    expect(
      limpiarDireccionEntrega(
        "Kukulcan Km 17, CANCUN, MX. Attn: Ixayana Cid, Sent From: Hilton,",
      ),
    ).toBe("Kukulcan Km 17, CANCUN, MX");
  });
});
