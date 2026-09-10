import { describe, expect, it } from "vitest";
import { applySurtidoToPrintData } from "./apply-surtido-to-print";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const BASE: OrdenTareaAlmacenPrintData = {
  idOrdenVenta: "ov-1",
  folio: "OV-1",
  impresa: "08/09 10:00",
  cliente: "Cliente",
  centroConsumo: "Cocina",
  numeroOrdenCliente: "OC",
  fechaEntrega: "08/09/2026",
  direccionEntrega: "Calle 1",
  lineas: [
    {
      producto: "Hamburguesa",
      especificacion: "",
      cantidadSolicitada: "5 kg",
    },
  ],
};

describe("applySurtidoToPrintData", () => {
  it("rellena cantidad preparada y código de la fila", () => {
    const updated = applySurtidoToPrintData(BASE, {
      campos: { Chofer: "Luis" },
      checks: { turnoPm: true },
      lineas: [
        {
          indice: 1,
          especificacion: "sin hielo",
          cantidadPreparada: "4.8 kg",
          codigoIncidencia: "A",
          nota: "Faltó stock",
          alisto: true,
          reviso: false,
        },
      ],
    });

    expect(updated.lineas[0]?.especificacion).toBe("sin hielo");
    expect(updated.lineas[0]?.cantidadPreparada).toBe("4.8 kg");
    expect(updated.lineas[0]?.codigoIncidencia).toBe("A");
    expect(updated.lineas[0]?.alisto).toBe(true);
    expect(updated.surtido?.campos.Chofer).toBe("Luis");
    expect(updated.surtido?.checks.turnoPm).toBe(true);
  });
});
