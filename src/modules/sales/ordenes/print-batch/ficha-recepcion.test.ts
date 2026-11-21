import { describe, expect, it } from "vitest";
import { fichaDesdeOrden } from "./ficha-recepcion";
import type { RecepcionPrefacturaEnlace } from "./recepcion-prefactura";

const enlace: RecepcionPrefacturaEnlace = {
  empresa: "Y9IHZ",
  ov: "OV-00002529",
  ot: "pedido:cunwa0035879|almacen:cantina",
  nombreEmpresa: "",
  cliente: "",
  numeroOt: "",
  totalOt: "",
  centroConsumo: "",
};

describe("fichaDesdeOrden", () => {
  it("pone empresa, cliente, número de OT y centro de la orden", () => {
    const ficha = fichaDesdeOrden(enlace, {
      razonSocial: "Aguacates de puebla",
      cliente: "Hotel Chicome",
      centroConsumo: "Hotel",
      origenCorreo: [
        {
          Producto: "AGUACATE",
          Cantidad: 1,
          Almacen: "Cantina",
          "Numero pedido": "cunwa0035879",
        },
      ],
    });

    expect(ficha.nombreEmpresa).toBe("Aguacates de puebla");
    expect(ficha.cliente).toBe("Hotel Chicome");
    expect(ficha.numeroOt).toBe("cunwa0035879");
    expect(ficha.centroConsumo).toBe("Cantina");
  });

  it("no usa la posición «2» como número de la OT", () => {
    const ficha = fichaDesdeOrden({ ...enlace, numeroOt: "2", totalOt: "3" }, null);
    expect(ficha.numeroOt).toBe("cunwa0035879");
  });

  it("no pisa los nombres que ya trajo el enlace", () => {
    const ficha = fichaDesdeOrden(
      { ...enlace, nombreEmpresa: "Del QR", cliente: "Del QR", numeroOt: "4500140182", centroConsumo: "Bar" },
      {
        razonSocial: "Otra",
        cliente: "Otro",
        centroConsumo: "Cocina",
        origenCorreo: null,
      },
    );

    expect(ficha.nombreEmpresa).toBe("Del QR");
    expect(ficha.cliente).toBe("Del QR");
    expect(ficha.numeroOt).toBe("cunwa0035879");
    expect(ficha.centroConsumo).toBe("Bar");
  });
});
