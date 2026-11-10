import { describe, expect, it } from "vitest";
import {
  ESTADO_ALISTADA,
  ESTADO_ALISTAMIENTO,
  cuentaDespachoDesdeQuery,
  nombreClienteDeComprador,
  partirOrdenesDespacho,
  preguntaConfirmacionDespacho,
  validarConfirmacionDespacho,
  type OrdenDespachoPublico,
} from "./despacho-publico";

function orden(
  estado: OrdenDespachoPublico["estado"],
  codigo: string,
): OrdenDespachoPublico {
  return {
    idOrdenVenta: codigo,
    codigo,
    estado,
    codigoCuenta: "023WA",
    nombreCliente: "Krystal Cancún",
  };
}

describe("validarConfirmacionDespacho", () => {
  const base = {
    idOrdenVenta: "ov-1",
    codigoCuenta: "023WA",
    despachador: "Ana",
    transportista: "Luis",
  };

  it("acepta los dos nombres", () => {
    const result = validarConfirmacionDespacho(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.despachador).toBe("Ana");
      expect(result.value.transportista).toBe("Luis");
    }
  });

  it("rechaza un nombre vacío con el mensaje exacto", () => {
    expect(validarConfirmacionDespacho({ ...base, despachador: "  " })).toEqual({
      ok: false,
      error: "Escribe quién despachó la mercancía.",
    });
    expect(validarConfirmacionDespacho({ ...base, transportista: "" })).toEqual({
      ok: false,
      error: "Escribe quién es el transportista.",
    });
  });

  it("acepta 120 caracteres y rechaza 121 con el mensaje exacto", () => {
    const limite = "a".repeat(120);
    const deMas = "a".repeat(121);
    const aceptado = validarConfirmacionDespacho({
      ...base,
      despachador: limite,
      transportista: limite,
    });
    expect(aceptado).toEqual({
      ok: true,
      value: { ...base, despachador: limite, transportista: limite },
    });
    expect(validarConfirmacionDespacho({ ...base, despachador: deMas })).toEqual({
      ok: false,
      error: "El nombre de quien despachó es demasiado largo.",
    });
    expect(validarConfirmacionDespacho({ ...base, transportista: deMas })).toEqual({
      ok: false,
      error: "El nombre del transportista es demasiado largo.",
    });
  });
});

describe("preguntaConfirmacionDespacho", () => {
  it("nombra la orden y el cliente", () => {
    expect(preguntaConfirmacionDespacho("OV-00000317", "CONDOMINIO FHP MAYAKOBA")).toBe(
      "¿Seguro que quieres despachar OV-00000317 de CONDOMINIO FHP MAYAKOBA?",
    );
  });
});

describe("cuentaDespachoDesdeQuery", () => {
  it("lee la cuenta del QR", () => {
    expect(cuentaDespachoDesdeQuery(" 023WA ")).toBe("023WA");
    expect(cuentaDespachoDesdeQuery(undefined)).toBe("");
  });
});

describe("nombreClienteDeComprador", () => {
  it("usa el nombre del comprador", () => {
    expect(nombreClienteDeComprador({ nombre: " Krystal Cancún " })).toBe(
      "Krystal Cancún",
    );
    expect(nombreClienteDeComprador([{ nombre: "Hive" }])).toBe("Hive");
    expect(nombreClienteDeComprador(null)).toBe("—");
  });
});

describe("partirOrdenesDespacho", () => {
  it("separa alistada y alistamiento", () => {
    const partes = partirOrdenesDespacho([
      orden(ESTADO_ALISTAMIENTO, "OV-2"),
      orden(ESTADO_ALISTADA, "OV-1"),
    ]);
    expect(partes.alistada.map((item) => item.codigo)).toEqual(["OV-1"]);
    expect(partes.alistamiento.map((item) => item.codigo)).toEqual(["OV-2"]);
  });
});
