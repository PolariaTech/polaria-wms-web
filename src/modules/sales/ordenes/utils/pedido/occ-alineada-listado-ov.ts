import { collectOrdenesCompraCliente } from "../display/orden-venta-tabla-meta";
import {
  isGarbageOcValue,
  resolveOrdenCompraLimpia,
} from "./normalize-numero-pedido";
import { resolveOccGuardada } from "./resolve-cabecera-guardada";

/**
 * REQ-170: la OCC del campo «Orden de compra del cliente» debe coincidir con
 * la que ya muestra la tabla (hotel + números de pedido en origen_correo).
 */
export function resolveOccCampoFormulario(input: {
  ordenCompraHotelGuardada?: string | null;
  propuestaMateo?: string | null;
  origenTexto?: string | null;
  origenCorreo?: unknown;
}): string {
  const desdeCabecera = resolveOccGuardada({
    guardada: input.ordenCompraHotelGuardada,
    propuesta: (input.propuestaMateo ?? "").trim(),
    origenTexto: input.origenTexto,
  }).trim();
  if (desdeCabecera && !isGarbageOcValue(desdeCabecera)) {
    return desdeCabecera;
  }

  const delListado = collectOrdenesCompraCliente({
    ordenCompraHotel: input.ordenCompraHotelGuardada,
    origenCorreo: input.origenCorreo,
  });
  for (const candidata of delListado) {
    const limpia = resolveOrdenCompraLimpia(
      candidata,
      input.origenTexto ?? "",
    ).trim();
    if (limpia && !isGarbageOcValue(limpia)) return limpia;
  }
  return "";
}

/** REQ-170: no mostrar alertas de pie mientras el bootstrap aún hidrata. */
export function revisionPendienteVisible(input: {
  formDataReady: boolean;
  isLoading: boolean;
  isReadingIa: boolean;
}): boolean {
  return (
    input.formDataReady && !input.isLoading && !input.isReadingIa
  );
}
