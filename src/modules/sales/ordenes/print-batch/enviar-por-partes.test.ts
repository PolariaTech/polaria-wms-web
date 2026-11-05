import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enviarPorPartes, ESPERA_ENTRE_PARTES_MS, esperarConCuenta } from "./enviar-por-partes";
import type { ParteEnvio } from "./partir-paquete";

const parte = (): ParteEnvio => ({ hojas: [], resumen: [] });
const tres = [parte(), parte(), parte()];

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("esperarConCuenta", () => {
  it("espera el tiempo completo avisando cada segundo cuánto falta", async () => {
    const avisos: number[] = [];

    const promesa = esperarConCuenta(3000, (r) => avisos.push(r), () => false);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(promesa).resolves.toBe(true);
    expect(avisos).toEqual([3, 2, 1]);
  });

  it("si se cancela a la mitad, corta y avisa", async () => {
    let cancelar = false;

    const promesa = esperarConCuenta(5000, () => undefined, () => cancelar);
    await vi.advanceTimersByTimeAsync(2000);
    cancelar = true;
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promesa).resolves.toBe(false);
  });
});

describe("enviarPorPartes", () => {
  it("la pausa entre partes es de un minuto, como propuso Edgar", () => {
    expect(ESPERA_ENTRE_PARTES_MS).toBe(60_000);
  });

  it("manda las partes en orden y espera entre ellas, no después de la última", async () => {
    const orden: string[] = [];
    const enviar = vi.fn(async (_p: ParteEnvio, i: number) => {
      orden.push(`parte ${i + 1}`);
      return `ok ${i + 1}`;
    });

    const promesa = enviarPorPartes({
      partes: tres,
      desde: 0,
      esperaMs: 2000,
      enviar,
      alCambiar: (_i, _t, fase) => {
        if (fase === "esperando") orden.push("espera");
      },
    });
    await vi.advanceTimersByTimeAsync(10_000);
    const resultado = await promesa;

    expect(orden.filter((x) => x !== "espera")).toEqual(["parte 1", "parte 2", "parte 3"]);
    // 2 pausas de 2 s (cada una avisa 2 veces): ninguna tras la última parte.
    expect(orden.filter((x) => x === "espera")).toHaveLength(4);
    expect(resultado).toEqual({ siguiente: 3, ultimo: "ok 3" });
  });

  it("sin espera (QZ o IPP) las manda seguidas", async () => {
    const enviar = vi.fn().mockResolvedValue("ok");

    const resultado = await enviarPorPartes({ partes: tres, desde: 0, esperaMs: 0, enviar });

    expect(enviar).toHaveBeenCalledTimes(3);
    expect(resultado.siguiente).toBe(3);
  });

  it("si una parte falla se detiene ahí y dice cuál, sin tocar las siguientes", async () => {
    const enviar = vi
      .fn()
      .mockResolvedValueOnce("ok 1")
      .mockRejectedValueOnce(new Error("SMTP caído"))
      .mockResolvedValue("ok 3");

    const resultado = await enviarPorPartes({ partes: tres, desde: 0, esperaMs: 0, enviar });

    expect(enviar).toHaveBeenCalledTimes(2);
    expect(resultado.siguiente).toBe(1);
    expect(resultado.ultimo).toBe("ok 1");
    expect(resultado.error).toEqual(new Error("SMTP caído"));
  });

  it("al reintentar desde la parte que falló no repite las que ya salieron", async () => {
    const enviar = vi.fn().mockResolvedValue("ok");

    const resultado = await enviarPorPartes({ partes: tres, desde: 1, esperaMs: 0, enviar });

    expect(enviar.mock.calls.map((c) => c[1])).toEqual([1, 2]);
    expect(resultado.siguiente).toBe(3);
  });

  it("si se cancela durante la espera, no manda la siguiente y dice desde dónde seguir", async () => {
    let cancelar = false;
    const enviar = vi.fn().mockResolvedValue("ok");

    const promesa = enviarPorPartes({
      partes: tres,
      desde: 0,
      esperaMs: 5000,
      enviar,
      cancelado: () => cancelar,
    });
    await vi.advanceTimersByTimeAsync(1000);
    cancelar = true;
    await vi.advanceTimersByTimeAsync(2000);
    const resultado = await promesa;

    expect(enviar).toHaveBeenCalledTimes(1);
    expect(resultado).toMatchObject({ siguiente: 1, cancelado: true });
  });

  it("una sola parte se manda sin esperar nada", async () => {
    const enviar = vi.fn().mockResolvedValue("ok");

    const resultado = await enviarPorPartes({ partes: [parte()], desde: 0, esperaMs: 60_000, enviar });

    expect(resultado).toEqual({ siguiente: 1, ultimo: "ok" });
  });
});
