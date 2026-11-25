import { describe, expect, it } from "vitest";
import {
  completarFichaRecepcion,
  filaDesdeConsulta,
} from "./cargar-ficha-recepcion.server";
import type { RecepcionPrefacturaEnlace } from "./recepcion-prefactura";

const enlace: RecepcionPrefacturaEnlace = {
  empresa: "Y9IHZ",
  ov: "OV-1",
  ot: "unica",
  nombreEmpresa: "",
  cliente: "",
  numeroOt: "",
  totalOt: "",
  centroConsumo: "",
};

describe("completarFichaRecepcion", () => {
  it("arma la fila con la razón social del comprador", () => {
    expect(
      filaDesdeConsulta(
        { razon_social: "Aguacates de puebla" },
        { comprador: { razon_social: "Hotel Chicome", nombre: "Ana" }, centro_consumo: "Cantina" },
      ),
    ).toMatchObject({
      razonSocial: "Aguacates de puebla",
      cliente: "Hotel Chicome",
      centroConsumo: "Cantina",
    });
  });

  it("si la consulta falla, la pantalla sigue con el código de la empresa", async () => {
    const ficha = await completarFichaRecepcion(enlace, {
      leer() {
        throw new Error("sin red");
      },
    });
    expect(ficha.nombreEmpresa).toBe("Y9IHZ");
    expect(ficha.cliente).toBe("");
  });
});
