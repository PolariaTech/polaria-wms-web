import type { OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";
import { isGarbageOcValue } from "../utils/pedido/normalize-numero-pedido";

/** Campos de cabecera del form que se escriben en el renglón de la OT activa (REQ-281). */
export type CabeceraFormParaOt = {
  almacen: string;
  numeroPedido: string;
  fecha: string;
  responsableExterno: string;
  telefonoOt: string;
  correoOt: string;
  direccionOt: string;
  andenOt: string;
  ventanaDesdeOt: string;
  ventanaHastaOt: string;
  notasOt: string;
  prioridadOt: string;
};

/**
 * REQ-281: el form manda, incluido el vacío (antes `||` dejaba el valor viejo del origen).
 * OC basura OCR se limpia como antes.
 */
export function aplicarCabeceraFormARenglonActivo(
  row: OrigenCorreoRenglon,
  cabecera: CabeceraFormParaOt,
): OrigenCorreoRenglon {
  return {
    ...row,
    Almacen: cabecera.almacen,
    "Numero pedido":
      cabecera.numeroPedido ||
      (isGarbageOcValue(row["Numero pedido"]) ? "" : row["Numero pedido"] || ""),
    Fecha: cabecera.fecha || row.Fecha,
    "Responsable externo": cabecera.responsableExterno,
    "Telefono contacto": cabecera.telefonoOt,
    "Correo contacto": cabecera.correoOt,
    "Direccion entrega": cabecera.direccionOt,
    Destino: cabecera.direccionOt,
    Anden: cabecera.andenOt || row.Anden,
    "Ventana desde": cabecera.ventanaDesdeOt || row["Ventana desde"],
    "Ventana hasta": cabecera.ventanaHastaOt || row["Ventana hasta"],
    "Notas generales": cabecera.notasOt,
    Prioridad: cabecera.prioridadOt || row.Prioridad,
  };
}

/** Cabecera de OV que se propaga a todas las OT (REQ-141 / REQ-281). */
export function aplicarCabeceraOvARenglonHermano(
  row: OrigenCorreoRenglon,
  cabecera: Pick<
    CabeceraFormParaOt,
    "notasOt" | "direccionOt" | "telefonoOt" | "correoOt" | "responsableExterno"
  >,
): OrigenCorreoRenglon {
  return {
    ...row,
    "Notas generales": cabecera.notasOt,
    "Direccion entrega": cabecera.direccionOt,
    Destino: cabecera.direccionOt,
    "Telefono contacto": cabecera.telefonoOt,
    "Correo contacto": cabecera.correoOt,
    "Responsable externo": cabecera.responsableExterno,
  };
}
