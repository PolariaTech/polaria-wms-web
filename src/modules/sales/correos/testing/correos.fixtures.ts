import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  TAMANO_BLOQUE_CORREOS,
  type CorreoFila,
  type IngresoCorreo,
} from "../types/correos.types";

export const MSG = "msg-descartado-1";

export const fila = (parcial: Partial<CorreoFila> = {}): CorreoFila => ({
  recibidoEn: "2026-11-03T13:27:51.000Z",
  de: "compras@hotel.com",
  para: null,
  asunto: "Pedido XEL",
  messageId: MSG,
  hilo: null,
  adjunto: "pedido.pdf",
  nuevoPedido: false,
  motivo: "Cotización, no es pedido",
  resultado: null,
  confianza: null,
  tipo: null,
  codigoOrdenVenta: null,
  idRegistro: "299",
  registradoEn: "2026-11-03T13:28:42.556Z",
  actualizadoEn: "2026-11-03T13:29:10.000Z",
  ingreso: null,
  ...parcial,
});

export const ingreso = (parcial: Partial<IngresoCorreo> = {}): IngresoCorreo => ({
  messageId: MSG,
  estado: "procesando",
  idOrdenVenta: null,
  codigoOrdenVenta: null,
  error: null,
  ...parcial,
});

export const lista = (filas: CorreoFila[], total = filas.length) => ({
  total,
  pagina: 1,
  tamano: TAMANO_BLOQUE_CORREOS,
  filas,
});

/** `cantidad` correos distintos, numerados desde `desde` (asunto «Correo 1», «Correo 2»…). */
export const filasDe = (cantidad: number, desde = 1): CorreoFila[] =>
  Array.from({ length: cantidad }, (_valor, indice) =>
    fila({
      messageId: `msg-${desde + indice}`,
      asunto: `Correo ${desde + indice}`,
      de: `remitente${desde + indice}@hotel.example`,
    }),
  );

export const BOTON_INGRESAR = /Ingresar como OV/;

/** El usuario de las pruebas, con los temporizadores simulados avanzando junto con el reloj. */
export function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}
