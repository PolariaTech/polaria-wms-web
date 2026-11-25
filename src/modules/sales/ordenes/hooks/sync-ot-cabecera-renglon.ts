import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../utils/origen/origen-correo-ordenes-trabajo";
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

function renglonesBase(hija: OrdenTrabajoHija): OrigenCorreoRenglon[] {
  return hija.renglones.length > 0
    ? hija.renglones
    : [{ Producto: "", Cantidad: 0 }];
}

/**
 * REQ-141: sin OT activa (multi-OT sin pager), igual limpia/propaga cabecera OV
 * (notas, contacto, tel, correo, dirección) en todas las hijas.
 */
export function propagarCabeceraOvATodasLasHijas(
  hijas: OrdenTrabajoHija[],
  cabecera: Pick<
    CabeceraFormParaOt,
    | "notasOt"
    | "direccionOt"
    | "telefonoOt"
    | "correoOt"
    | "responsableExterno"
    | "fecha"
  >,
): OrdenTrabajoHija[] {
  return hijas.map((hija) => ({
    ...hija,
    fecha: cabecera.fecha || hija.fecha,
    renglones: renglonesBase(hija).map((row) =>
      aplicarCabeceraOvARenglonHermano(row, cabecera),
    ),
  }));
}

export type OpcionesSyncCabeceraOt = {
  /**
   * REQ-337: al guardar, misma fecha en todas las OT.
   * REQ-374: al paginar sin cambio de fecha debe ser false para no pisar hermanas.
   * REQ-423: al paginar con la fecha cambiada se propaga a todas las OT.
   */
  propagarFechaOv?: boolean;
};

/** Sync form → OT activa + cabecera OV a hermanas (REQ-141 / REQ-281). */
export function aplicarCabeceraFormAOrdenesTrabajo(
  hijas: OrdenTrabajoHija[],
  targetHijaId: string,
  cabecera: CabeceraFormParaOt,
  opciones?: OpcionesSyncCabeceraOt,
): OrdenTrabajoHija[] {
  const propagarFechaOv = opciones?.propagarFechaOv !== false;
  return hijas.map((hija) => {
    if (hija.id !== targetHijaId) {
      return {
        ...hija,
        // REQ-337: misma fecha de entrega en todas las OT de la OV (solo si se pide).
        fecha: propagarFechaOv ? cabecera.fecha || hija.fecha : hija.fecha,
        renglones: renglonesBase(hija).map((row) =>
          aplicarCabeceraOvARenglonHermano(row, cabecera, { propagarFechaOv }),
        ),
      };
    }
    const renglones = renglonesBase(hija).map((row) =>
      aplicarCabeceraFormARenglonActivo(row, cabecera),
    );
    const label =
      (cabecera.numeroPedido && cabecera.almacen
        ? `${cabecera.numeroPedido} — ${cabecera.almacen}`
        : cabecera.almacen || cabecera.numeroPedido) || hija.label;
    return {
      ...hija,
      almacen: cabecera.almacen,
      numeroPedido: cabecera.numeroPedido,
      fecha: cabecera.fecha,
      responsableExterno: cabecera.responsableExterno,
      label,
      renglones,
    };
  });
}

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

/** Cabecera de OV que se propaga a todas las OT (REQ-141 / REQ-281 / REQ-337 fecha). */
export function aplicarCabeceraOvARenglonHermano(
  row: OrigenCorreoRenglon,
  cabecera: Pick<
    CabeceraFormParaOt,
    | "notasOt"
    | "direccionOt"
    | "telefonoOt"
    | "correoOt"
    | "responsableExterno"
    | "fecha"
  >,
  opciones?: OpcionesSyncCabeceraOt,
): OrigenCorreoRenglon {
  const propagarFechaOv = opciones?.propagarFechaOv !== false;
  return {
    ...row,
    "Notas generales": cabecera.notasOt,
    "Direccion entrega": cabecera.direccionOt,
    Destino: cabecera.direccionOt,
    "Telefono contacto": cabecera.telefonoOt,
    "Correo contacto": cabecera.correoOt,
    "Responsable externo": cabecera.responsableExterno,
    // REQ-337: una OV = un día de entrega; al paginar (REQ-374) no se pisa.
    Fecha: propagarFechaOv ? cabecera.fecha || row.Fecha : row.Fecha,
  };
}
