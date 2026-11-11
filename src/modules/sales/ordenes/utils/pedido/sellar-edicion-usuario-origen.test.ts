import { describe, expect, it } from "vitest";
import {
  leerCabeceraUsuarioSello,
  resolveCampoConSelloUsuario,
  sellarCabeceraUsuarioEnOrigen,
} from "./sellar-edicion-usuario-origen";

const selloVacio = {
  notasGenerales: "",
  centroConsumo: "",
  referenciaPedido: "",
  fechaEntrega: "",
  direccionEntrega: "",
  contacto: "",
  telefono: "",
  correo: "",
};

describe("sellarCabeceraUsuarioEnOrigen (REQ-281)", () => {
  it("sella la cabecera en todas las filas, incluido vacío deliberado", () => {
    const filas = sellarCabeceraUsuarioEnOrigen(
      [
        { Producto: "Aguacate", Cantidad: 2, Almacen: "SUSHI" },
        { Producto: "Limón", Cantidad: 1, Almacen: "SUSHI" },
      ],
      { ...selloVacio, notasGenerales: "", centroConsumo: "" },
    );
    expect(leerCabeceraUsuarioSello(filas)?.notasGenerales).toBe("");
    expect(leerCabeceraUsuarioSello(filas)?.centroConsumo).toBe("");
    expect(filas).toHaveLength(2);
  });

  it("sin filas crea un renglón mínimo con el sello", () => {
    const filas = sellarCabeceraUsuarioEnOrigen([], {
      ...selloVacio,
      telefono: "9617995980",
    });
    expect(filas).toHaveLength(1);
    expect(leerCabeceraUsuarioSello(filas)?.telefono).toBe("9617995980");
  });
});

describe("resolveCampoConSelloUsuario (REQ-281)", () => {
  it("con sello vacío no vuelve la propuesta de Mateo", () => {
    expect(
      resolveCampoConSelloUsuario({
        sello: { ...selloVacio, notasGenerales: "" },
        key: "notasGenerales",
        guardadoBd: "",
        propuestaMateo: "PEDIDO ADP — Emisión 18:10",
      }),
    ).toBe("");
  });

  it("sin sello completa desde Mateo si BD está vacía", () => {
    expect(
      resolveCampoConSelloUsuario({
        sello: null,
        key: "telefono",
        guardadoBd: "",
        propuestaMateo: "9617995980",
      }),
    ).toBe("9617995980");
  });

  it("con sello manda lo que escribió el usuario", () => {
    expect(
      resolveCampoConSelloUsuario({
        sello: { ...selloVacio, centroConsumo: "BAR" },
        key: "centroConsumo",
        guardadoBd: "SUSHI CENTRAL",
        propuestaMateo: "SUSHI CENTRAL",
      }),
    ).toBe("BAR");
  });
});
