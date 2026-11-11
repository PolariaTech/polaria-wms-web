import { beforeEach, describe, expect, it, vi } from "vitest";
import { validarConfirmacionDespacho } from "@/modules/sales/ordenes/despacho/despacho-publico";
import { POST } from "./route";

const confirmar = vi.hoisted(() => vi.fn());

vi.mock("@/modules/sales/ordenes/despacho/despacho-publico.service", () => ({
  confirmarDespachoPublico: confirmar,
}));

function pedido(body: unknown): Request {
  return new Request("http://local/despacho/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /despacho/api", () => {
  beforeEach(() => {
    confirmar.mockReset();
  });

  it("no cambia el estado si falta un nombre", async () => {
    const respuesta = await POST(
      pedido({
        idOrdenVenta: "ov-1",
        codigoCuenta: "023WA",
        despachador: "Ana",
        transportista: " ",
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      ok: false,
      error: "Escribe quién es el transportista.",
    });
    expect(confirmar).not.toHaveBeenCalled();
  });

  it("no cambia el estado si falta quien despachó", async () => {
    const respuesta = await POST(
      pedido({
        idOrdenVenta: "ov-1",
        codigoCuenta: "023WA",
        despachador: " ",
        transportista: "Luis",
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      ok: false,
      error: "Escribe quién despachó la mercancía.",
    });
    expect(confirmar).not.toHaveBeenCalled();
  });

  it("devuelve el mismo mensaje si el nombre pasa de 120", async () => {
    const respuesta = await POST(
      pedido({
        idOrdenVenta: "ov-1",
        codigoCuenta: "023WA",
        despachador: "a".repeat(121),
        transportista: "Luis",
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      ok: false,
      error: "El nombre de quien despachó es demasiado largo.",
    });
    expect(confirmar).not.toHaveBeenCalled();
  });

  it("rechaza al transportista de 121 caracteres", async () => {
    const respuesta = await POST(
      pedido({
        idOrdenVenta: "ov-1",
        codigoCuenta: "023WA",
        despachador: "Ana",
        transportista: "b".repeat(121),
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      ok: false,
      error: "El nombre del transportista es demasiado largo.",
    });
    expect(confirmar).not.toHaveBeenCalled();
  });

  it("repite el resultado de validarConfirmacionDespacho en 120 y en 121", async () => {
    const limite = "a".repeat(120);
    const cuerpoValido = {
      idOrdenVenta: "ov-1",
      codigoCuenta: "023WA",
      despachador: limite,
      transportista: limite,
    };
    const validacionValida = validarConfirmacionDespacho(cuerpoValido);
    expect(validacionValida.ok).toBe(true);
    confirmar.mockResolvedValue({ ok: true });

    const respuestaValida = await POST(pedido(cuerpoValido));
    expect(respuestaValida.status).toBe(200);
    expect(await respuestaValida.json()).toEqual({ ok: true });

    const cuerpoLargo = { ...cuerpoValido, transportista: "b".repeat(121) };
    const validacionLarga = validarConfirmacionDespacho(cuerpoLargo);
    expect(validacionLarga.ok).toBe(false);

    const respuestaLarga = await POST(pedido(cuerpoLargo));
    expect(respuestaLarga.status).toBe(400);
    if (!validacionLarga.ok) {
      expect(await respuestaLarga.json()).toEqual({
        ok: false,
        error: validacionLarga.error,
      });
    }
  });

  it("confirma cuando los dos nombres vienen", async () => {
    confirmar.mockResolvedValue({ ok: true });

    const respuesta = await POST(
      pedido({
        idOrdenVenta: "ov-1",
        codigoCuenta: "023WA",
        despachador: "Ana",
        transportista: "Luis",
      }),
    );

    expect(respuesta.status).toBe(200);
    expect(confirmar).toHaveBeenCalledWith({
      idOrdenVenta: "ov-1",
      codigoCuenta: "023WA",
      despachador: "Ana",
      transportista: "Luis",
    });
  });
});
