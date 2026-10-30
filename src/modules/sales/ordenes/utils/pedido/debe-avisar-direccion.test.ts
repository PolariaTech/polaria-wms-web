import { describe, expect, it } from "vitest";
import { debeAvisarVerificarDireccion } from "./debe-avisar-direccion";

describe("debeAvisarVerificarDireccion", () => {
  it("avisa cuando el usuario cambia de un cliente a otro", () => {
    expect(
      debeAvisarVerificarDireccion({
        verificarDireccionEntrega: true,
        idClienteAnterior: 10,
        idClienteNuevo: 20,
      }),
    ).toBe(true);
  });

  it("no avisa al confirmar el mismo cliente", () => {
    expect(
      debeAvisarVerificarDireccion({
        verificarDireccionEntrega: true,
        idClienteAnterior: 10,
        idClienteNuevo: 10,
      }),
    ).toBe(false);
  });

  it("no avisa al elegir el primer cliente aunque el pedido ya traiga dirección", () => {
    expect(
      debeAvisarVerificarDireccion({
        verificarDireccionEntrega: true,
        idClienteAnterior: null,
        idClienteNuevo: 20,
      }),
    ).toBe(false);
  });

  it("no avisa cuando el cambio no lo hizo el usuario", () => {
    expect(
      debeAvisarVerificarDireccion({
        verificarDireccionEntrega: false,
        idClienteAnterior: 10,
        idClienteNuevo: 20,
      }),
    ).toBe(false);
  });

  it("no avisa si la opción no viene definida", () => {
    expect(
      debeAvisarVerificarDireccion({
        verificarDireccionEntrega: undefined,
        idClienteAnterior: 10,
        idClienteNuevo: 20,
      }),
    ).toBe(false);
  });
});
