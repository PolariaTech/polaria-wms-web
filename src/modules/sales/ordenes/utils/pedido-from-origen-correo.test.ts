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
});
