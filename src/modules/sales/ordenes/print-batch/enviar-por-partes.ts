import type { ParteEnvio } from "./partir-paquete";

/** Pausa entre partes: la propuso Edgar en la daily (un correo por minuto) para no saturar la impresora ni el SMTP. */
export const ESPERA_ENTRE_PARTES_MS = 60_000;

export type FaseEnvio = "enviando" | "esperando";

export interface ResultadoEnvioPartes<R> {
  /** Índice (0-based) de la próxima parte por mandar; igual al total si ya salieron todas. */
  siguiente: number;
  /** Resultado de la última parte que sí salió. */
  ultimo?: R;
  /** Por qué se detuvo: un fallo de la parte `siguiente` o que se canceló. */
  error?: unknown;
  cancelado?: boolean;
}

/** Espera `ms` avisando cada segundo cuánto falta; devuelve `false` si se canceló antes de terminar. */
export async function esperarConCuenta(
  ms: number,
  alSegundo: (restantes: number) => void,
  cancelado: () => boolean,
): Promise<boolean> {
  for (let restantes = Math.ceil(ms / 1000); restantes > 0; restantes -= 1) {
    if (cancelado()) return false;
    alSegundo(restantes);
    await new Promise<void>((listo) => setTimeout(listo, 1000));
  }
  return !cancelado();
}

/**
 * Manda las partes una tras otra desde `desde`, esperando `esperaMs` entre ellas. Si una falla se
 * detiene ahí y dice cuál: reintentar con `desde = siguiente` no repite las que ya salieron (así no
 * se duplican hojas en la impresora).
 */
export async function enviarPorPartes<R>(input: {
  partes: readonly ParteEnvio[];
  desde: number;
  esperaMs: number;
  enviar: (parte: ParteEnvio, indice: number) => Promise<R>;
  alCambiar?: (indice: number, total: number, fase: FaseEnvio, segundosRestantes?: number) => void;
  cancelado?: () => boolean;
}): Promise<ResultadoEnvioPartes<R>> {
  const { partes, desde, esperaMs, enviar, alCambiar, cancelado = () => false } = input;
  let ultimo: R | undefined;

  for (let indice = desde; indice < partes.length; indice += 1) {
    if (cancelado()) return { siguiente: indice, ultimo, cancelado: true };
    alCambiar?.(indice, partes.length, "enviando");
    try {
      ultimo = await enviar(partes[indice]!, indice);
    } catch (error: unknown) {
      return { siguiente: indice, ultimo, error };
    }
    const quedan = indice < partes.length - 1;
    if (quedan && esperaMs > 0) {
      const sigue = await esperarConCuenta(
        esperaMs,
        (restantes) => alCambiar?.(indice, partes.length, "esperando", restantes),
        cancelado,
      );
      if (!sigue) return { siguiente: indice + 1, ultimo, cancelado: true };
    }
  }
  return { siguiente: partes.length, ultimo };
}
