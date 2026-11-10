import type { CorreoFila } from "../types/correos.types";

/** REQ-275: qué se le dice al operador de cada correo en la columna «Ingreso». */

/** Un correo «recibido» que no avanza en este tiempo se considera sin procesar. */
export const MINUTOS_PARA_SIN_PROCESAR = 5;

export type AvisoIngreso = "duplicado" | "flujoFallo" | "sinProcesar" | "revisar";

export type EstadoIngreso =
  /** Ya es una OV: una o varias. Sin código solo si el ingreso manual no lo devolvió. */
  | { tipo: "ingresado"; codigos: string[] }
  | { tipo: "ingresando" }
  /** El flujo lo recibió hace poco y todavía lo está procesando. */
  | { tipo: "procesando" }
  /** Filas anteriores a las columnas nuevas: el flujo lo tomó, sin más datos. */
  | { tipo: "porElFlujo" }
  | { tipo: "ingresar"; reintentar: boolean; aviso: AvisoIngreso | null };

/** `"OV-1, OV-2"` → `["OV-1", "OV-2"]`. */
export function separarCodigosOrden(valor: string | null): string[] {
  if (!valor) return [];
  return valor
    .split(",")
    .map((codigo) => codigo.trim())
    .filter(Boolean);
}

const ingresar = (reintentar: boolean, aviso: AvisoIngreso | null): EstadoIngreso => ({
  tipo: "ingresar",
  reintentar,
  aviso,
});

function llevaMuchoSinProcesar(registradoEn: string | null, ahora: number): boolean {
  const registrado = registradoEn ? Date.parse(registradoEn) : Number.NaN;
  if (Number.isNaN(registrado)) return true;
  return ahora - registrado >= MINUTOS_PARA_SIN_PROCESAR * 60_000;
}

/** La primera regla que se cumpla manda; el orden es el de la tabla de decisión del REQ-275. */
export function estadoDelIngreso(fila: CorreoFila, ahora: number = Date.now()): EstadoIngreso {
  const { ingreso, resultado } = fila;
  if (ingreso?.estado === "ingresado") {
    return { tipo: "ingresado", codigos: separarCodigosOrden(ingreso.codigoOrdenVenta) };
  }
  if (ingreso?.estado === "procesando") return { tipo: "ingresando" };

  const codigos = separarCodigosOrden(fila.codigoOrdenVenta);
  if (resultado === "ingresado" && codigos.length > 0) return { tipo: "ingresado", codigos };

  if (ingreso?.estado === "error") return ingresar(true, null);
  if (resultado === "duplicado") return ingresar(false, "duplicado");
  if (resultado === "error") return ingresar(false, "flujoFallo");

  if (fila.nuevoPedido === false || resultado === "no_es_pedido") {
    const dudoso = fila.confianza === "media" || fila.confianza === "baja";
    return ingresar(false, dudoso ? "revisar" : null);
  }
  if (resultado === "recibido") {
    return llevaMuchoSinProcesar(fila.registradoEn, ahora)
      ? ingresar(false, "sinProcesar")
      : { tipo: "procesando" };
  }
  return { tipo: "porElFlujo" };
}

/** Un correo se puede ingresar a mano cuando su estado ofrece el botón. */
export const puedeIngresarAMano = (fila: CorreoFila, ahora?: number): boolean =>
  estadoDelIngreso(fila, ahora).tipo === "ingresar";
