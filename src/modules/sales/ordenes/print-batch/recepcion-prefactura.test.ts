import { describe, expect, it } from "vitest";
import {
  etiquetaNumeroOt,
  leerRecepcionQuery,
  preguntaRecepcion,
  urlRecepcionPrefactura,
  validarDecisionRecepcion,
} from "./recepcion-prefactura";

describe("recepcion de prefactura", () => {
  it("arma el enlace con empresa, OV y OT", () => {
    expect(urlRecepcionPrefactura("http://localhost:3001/", "Y9IHZ", "OV-00002487", "unica")).toBe(
      "http://localhost:3001/recepcion-prefactura?empresa=Y9IHZ&ov=OV-00002487&ot=unica",
    );
  });

  it("pregunta según la opción marcada", () => {
    expect(preguntaRecepcion("aceptar")).toBe("¿Estás de acuerdo con aceptar esta prefactura?");
    expect(preguntaRecepcion("parcial")).toBe(
      "¿Estás de acuerdo con registrar un aceptado parcial?",
    );
    expect(preguntaRecepcion("rechazado")).toBe("¿Estás de acuerdo con rechazar esta prefactura?");
    expect(validarDecisionRecepcion("")).toBe("Elige Aceptar, Aceptado parcial o Rechazado.");
  });

  it("lleva al celular el nombre de la empresa, el cliente, la OT y el centro", () => {
    const enlace = urlRecepcionPrefactura("http://localhost:3001", "Y9IHZ", "OV-1", "ot-2", {
      nombreEmpresa: "Aguacates de puebla",
      cliente: "Hotel Chicome",
      numeroOt: "4500140182",
      totalOt: "3",
      centroConsumo: "Cantina",
    });
    const params = new URL(enlace).searchParams;
    expect(params.get("nombre")).toBe("Aguacates de puebla");
    expect(params.get("cliente")).toBe("Hotel Chicome");
    expect(params.get("otn")).toBe("4500140182");
    expect(params.get("ott")).toBe("3");
    expect(params.get("centro")).toBe("Cantina");
    expect(etiquetaNumeroOt("4500140182")).toBe("4500140182");
    expect(etiquetaNumeroOt("")).toBe("");
  });

  it("exige empresa, OV y OT en el enlace", () => {
    expect(leerRecepcionQuery({ empresa: "Y9IHZ", ov: "OV-1", ot: "unica" })).toEqual({
      empresa: "Y9IHZ",
      ov: "OV-1",
      ot: "unica",
      nombreEmpresa: "",
      cliente: "",
      numeroOt: "",
      totalOt: "",
      centroConsumo: "",
    });
    expect(leerRecepcionQuery({ empresa: "Y9IHZ", ov: "OV-1" })).toBeNull();
  });
});
