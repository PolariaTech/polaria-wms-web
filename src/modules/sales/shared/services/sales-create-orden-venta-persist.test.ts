import { beforeEach, describe, expect, it, vi } from "vitest";

const filasInsertadas = vi.hoisted(() => ({
  filas: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabase/domain-query", () => ({
  requireCodigoCuenta: (codigo: string) => codigo,
  runDomainQuery: vi.fn(),
  runDomainMutation: async (
    callback: (cliente: unknown) => PromiseLike<{ error: { message: string } | null }>,
  ) => {
    const cliente = {
      from: () => ({
        insert: (filas: Record<string, unknown>[]) => {
          filasInsertadas.filas.push(...filas);
          return Promise.resolve({ data: null, error: null });
        },
      }),
    };
    const resultado = await callback(cliente);
    if (resultado.error) throw new Error(resultado.error.message);
    return null;
  },
}));

import {
  buildLineasResumenCreate,
  insertLineasOrdenVenta,
} from "./sales-create-orden-venta-persist";

describe("sales-create-orden-venta-persist", () => {
  beforeEach(() => {
    filasInsertadas.filas = [];
  });

  it("buildLineasResumenCreate suma kg y total con precio de catálogo o explícito", () => {
    const resumen = buildLineasResumenCreate(
      [
        { idProducto: "p1", cantidadPedida: 2 },
        { idProducto: "p2", cantidadPedida: 3, precioUnitario: 10 },
      ],
      new Map([["p1", 5]]),
    );

    expect(resumen).toEqual({ count: 2, cantidadKg: 5, total: 40 });
  });

  it("insertLineasOrdenVenta no hace nada sin líneas", async () => {
    await expect(
      insertLineasOrdenVenta("ov1", [], new Map()),
    ).resolves.toBeUndefined();
    expect(filasInsertadas.filas).toEqual([]);
  });

  it("REQ-370: insertLineasOrdenVenta guarda posicion 0, 1… en el orden recibido", async () => {
    await insertLineasOrdenVenta(
      "ov1",
      [
        { idProducto: "limon", cantidadPedida: 30 },
        { idProducto: "pina", cantidadPedida: 30 },
        { idProducto: "papaya", cantidadPedida: 8 },
      ],
      new Map(),
    );

    expect(filasInsertadas.filas.map((fila) => fila.id_producto)).toEqual([
      "limon",
      "pina",
      "papaya",
    ]);
    expect(filasInsertadas.filas.map((fila) => fila.posicion)).toEqual([0, 1, 2]);
  });
});
