import { beforeEach, describe, expect, it, vi } from "vitest";
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
    expect(confirmar).not.toHaveBeenCalled();
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
