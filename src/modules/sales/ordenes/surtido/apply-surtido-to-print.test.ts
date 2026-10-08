import { describe, expect, it } from "vitest";
import {
  applySurtidoToPrintData,
  campoSurtido,
  campoSurtidoExact,
} from "./apply-surtido-to-print";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const BASE: OrdenTareaAlmacenPrintData = {
  idOrdenVenta: "ov-1",
  folio: "OV-1",
  creada: "07/09 09:00",
  impresa: "08/09 10:00",
  cliente: "Cliente",
  centroConsumo: "Cocina",
  numeroOrdenCliente: "OC",
  ordenTrabajo: "1/1",
  fechaEntrega: "08/09/2026",
  horaEntrega: "10:00 – 12:00",
  direccionEntrega: "Calle 1",
  notasGenerales: "",
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

  it("no mete el texto de Incidencias en la columna Especificación", () => {
    const updated = applySurtidoToPrintData(
      {
        ...BASE,
        lineas: [
          {
            producto: "Hamburguesa",
            especificacion: "Firme",
            cantidadSolicitada: "5 kg",
          },
        ],
      },
      {
        campos: { incidencias: "Faltó media caja en andén 2" },
        checks: {},
        lineas: [
          {
            indice: 1,
            especificacion: "Faltó media caja en andén 2",
          },
        ],
      },
    );

    expect(updated.lineas[0]?.especificacion).toBe("Firme");
    expect(updated.surtido?.campos.incidencias).toBe(
      "Faltó media caja en andén 2",
    );
  });

  it("no pone en Incidencias lo que es especificación de producto", () => {
    const updated = applySurtidoToPrintData(
      {
        ...BASE,
        lineas: [
          {
            producto: "Hamburguesa",
            especificacion: "sin hielo",
            cantidadSolicitada: "5 kg",
          },
        ],
      },
      {
        campos: { incidencias: "sin hielo" },
        checks: {},
        lineas: [{ indice: 1, especificacion: "sin hielo" }],
      },
    );

    expect(updated.lineas[0]?.especificacion).toBe("sin hielo");
    expect(updated.surtido?.campos.incidencias).toBe("");
  });

  it("no pinta Factura asociada con el nombre de Factura (OK)", () => {
    const payload = {
      campos: {
        facturaOkNombre: "Luis Cantillo",
        "Factura (OK) nombre": "Luis Cantillo",
        alistoNombre: "Luis Cantillo",
      },
      checks: {},
      lineas: [],
    };
    const updated = applySurtidoToPrintData(BASE, payload);

    expect(
      campoSurtidoExact(
        updated.surtido,
        "facturaAsociada",
        "Factura asociada",
      ),
    ).toBe("");
    // Regresión: alias corto "factura" no debe cruzar con Factura (OK).
    expect(campoSurtido(payload, "facturaAsociada", "Factura asociada", "factura")).toBe(
      "",
    );
  });

  it("rellena cabecera vacía del PDF con lo manuscrito", () => {
    const updated = applySurtidoToPrintData(
      {
        ...BASE,
        centroConsumo: "",
        numeroOrdenCliente: "",
        fechaEntrega: "",
        direccionEntrega: "",
      },
      {
        campos: {
          centroConsumo: "Banquetes",
          numeroOrdenCliente: "OC-1",
          fechaEntrega: "14/09/2026",
          direccionEntrega: "Av. 1",
        },
        checks: {},
        lineas: [],
      },
    );

    expect(updated.centroConsumo).toBe("Banquetes");
    expect(updated.numeroOrdenCliente).toBe("OC-1");
    expect(updated.fechaEntrega).toBe("14/09/2026");
    expect(updated.direccionEntrega).toBe("Av. 1");
  });
});
