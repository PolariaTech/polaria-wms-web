import { inesperada, leerFila, pedir } from "./correos.client";
import type { CorreoFila } from "../types/correos.types";

/** Una fila de la lista (`GET /ventas/correos/:messageId`) para la vista del correo completo. */
export async function obtenerFilaCorreo(
  messageId: string,
  signal?: AbortSignal,
): Promise<CorreoFila> {
  const cuerpo = await pedir(`/ventas/correos/${encodeURIComponent(messageId)}`, {
    method: "GET",
    signal,
  });
  const fila = leerFila(cuerpo);
  if (!fila) throw inesperada();
  return fila;
}
