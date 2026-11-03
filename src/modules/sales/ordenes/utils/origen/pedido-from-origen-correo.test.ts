import { describe, expect, it } from "vitest";
import { buildPedidoExtraidoFromOrigenCorreo } from "./pedido-from-origen-correo";

describe("buildPedidoExtraidoFromOrigenCorreo", () => {
  it("arma cabecera y líneas desde el JSON del tercero", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        {
          Fecha: "2026-10-08",
          Precio: 67,
          Almacen: "Almacen General",
          Cantidad: 27,
          Producto: "AGUACATE JASS",
          "Numero pedido": "4501084810",
          "Nombre cliente": "Experiencias Xcaret Parques",
          "Codigo producto": "X200011700",
          "Responsable externo": "HOMERO GARCIA GORDILLO",
          "Ventana desde": "06:00",
          "Ventana hasta": "06:00",
          Destino: "Parque Xcaret",
          "Direccion entrega": "Parque Xcaret",
          "Telefono contacto": "9981234567",
          Prioridad: "Normal",
          "Notas generales":
            "Entrega 08 DE OCTUBRE DE 2026 a las 6:00 am. Destino: Parque Xcaret.",
        },
      ],
    });

    expect(pedido.nombreCliente).toBe("Experiencias Xcaret Parques");
    expect(pedido.ordenCompraHotel).toBe("4501084810");
    expect(pedido.centroConsumo).toBe("Almacen General");
    expect(pedido.fechaEntrega).toBe("2026-10-08");
    expect(pedido.contacto).toBe("HOMERO GARCIA GORDILLO");
    expect(pedido.horarioDesde).toBe("06:00");
    expect(pedido.horarioHasta).toBe("06:00");
    expect(pedido.direccion).toBe("Parque Xcaret");
    expect(pedido.telefono).toBe("9981234567");
    expect(pedido.lineas).toHaveLength(1);
    expect(pedido.lineas[0]?.textoOriginal).toBe("AGUACATE JASS");
    expect(pedido.lineas[0]?.cantidad).toBe(27);
    expect(pedido.lineas[0]?.precioUnitario).toBe(67);
    expect(pedido.origenCorreo).toHaveLength(1);
  });

  it("toma el correo del remitente De/From del origen_texto", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        {
          Cantidad: 1,
          Producto: "Limón",
          "Responsable externo": "Arduizur C. Vargas",
        },
      ],
      origenTexto: [
        'De: "Arduizur Casquera Vargas" <asistadmin.kcc@krystal-hotels.com>',
        "Para: Ventas@aguacatesdepuebla.com",
        "",
        "Buen día,",
      ].join("\n"),
    });

    expect(pedido.correo).toBe("asistadmin.kcc@krystal-hotels.com");
    expect(pedido.contacto).toBe("Arduizur C. Vargas");
  });

  it("acepta Fecha dd/mm/aaaa y completa horas desde el cuerpo", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        {
          Fecha: "21/10/2026",
          Cantidad: 1,
          Producto: "Jugo de Limón",
          "Numero pedido": "MYG-0015033",
          "Ventana desde": "",
          "Ventana hasta": "",
        },
      ],
      origenTexto:
        "Fecha de entrega: 21/10/2026\nVentana de recepción: 8:00 AM – 2:00 PM",
      hoyISO: "2026-10-16",
    });

    expect(pedido.fechaEntrega).toBe("2026-10-21");
    expect(pedido.horarioDesde).toBe("08:00");
    expect(pedido.horarioHasta).toBe("14:00");
  });

  it("acepta Fecha MM/DD BirchStreet en origen_correo", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        {
          Fecha: "10/24/2026",
          Cantidad: 1,
          Producto: "Aguacate Hass",
          "Numero pedido": "CUNHI0101274",
          "Ventana desde": "07:00",
          "Ventana hasta": "13:00",
        },
      ],
      origenTexto:
        "From: bss_system@birchstreet.net\nDelivery date: 10/24/2026",
      hoyISO: "2026-10-22",
    });

    expect(pedido.fechaEntrega).toBe("2026-10-24");
  });

  it("REQ-158: pone la maduración de cada producto, también si el nombre no la trae", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        { Cantidad: 10, Producto: "Aguacate Hass", Maduración: "enrriados" },
        { Cantidad: 4, Producto: "Jitomate" },
        { Cantidad: 2, Producto: "Cebolla" },
      ],
      origenTexto: [
        "Producto        Maduración",
        "Aguacate Hass   Enrriados",
        "Jitomate        Rojo",
        "Cebolla",
      ].join("\n"),
    });

    expect(pedido.lineas.map((linea) => linea.especificacion)).toEqual([
      "Enrriado",
      "Rojo",
      null,
    ]);
  });

  it("REQ-239: en BirchStreet limpia dirección, correo operativo y notas", () => {
    const origenTexto = [
      "De: bss_system@birchstreet.net",
      "Para: pedidos@aguacatesdepuebla.com",
      "",
      "Sent By:",
      "Ixayana Cid",
      "NODEPT",
      "Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO",
      "Ixayana.Cid@Hilton.com",
      "",
      "Ship To: Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO",
      "Kukulcan Km 17, Zona Hotelera",
      "CANCUN, ROO, 77500, MX",
      "Attn: Ixayana Cid",
      "CONTACTO: CUNMC_CXP@Hilton.com",
    ].join("\n");
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        {
          Cantidad: 1,
          Producto: "Aguacate Hass",
          "Correo contacto": "CUNMC_CXP@Hilton.com",
          "Direccion entrega":
            "Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO, Kukulcan Km 17, Zona Hotelera, CANCUN, ROO, 77500, MX. Attn: Ixayana Cid, Sent From: Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT,",
          "Notas generales":
            "Horario de recepción: lunes a viernes de 8:00 AM a 2:00 PM; sábados de 8:00 AM a 12:00 PM. Pedido parcial no aceptado.",
        },
      ],
      origenTexto,
    });

    expect(pedido.direccion).toBe(
      "Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO, Kukulcan Km 17, Zona Hotelera, CANCUN, ROO, 77500, MX",
    );
    expect(pedido.correo).toBe("Ixayana.Cid@Hilton.com");
    expect(pedido.observaciones).toBe("Pedido parcial no aceptado.");
  });

  it("REQ-158: 3 piezas aprox 5.4 kg queda como 5.4 kg y especificación 3 PZA", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        {
          Cantidad: 3,
          Producto: "Aguacate Hass",
        },
      ],
      origenTexto: "Aguacate Hass 3 piezas, aprox 5.4 KG",
    });

    expect(pedido.lineas[0]?.cantidad).toBe(5.4);
    expect(pedido.lineas[0]?.especificacion).toBe("3 PZA");
    expect(pedido.lineas[0]?.unidad).toBe("KGM");
  });
});
