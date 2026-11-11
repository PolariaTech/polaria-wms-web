import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";

/**
 * REQ-281: snapshot de cabecera/entrega que el usuario dejó al guardar.
 * Mateo sugiere; si el usuario borra o corrige, este sello manda al reabrir
 * (incluido el vacío). Sin sello = la OV aún no se guardó desde el form.
 */
export type CabeceraUsuarioSello = {
  notasGenerales: string;
  centroConsumo: string;
  referenciaPedido: string;
  fechaEntrega: string;
  direccionEntrega: string;
  contacto: string;
  telefono: string;
  correo: string;
};

export type OrigenCorreoConSello = OrigenCorreoRenglon & {
  _cabeceraUsuario?: CabeceraUsuarioSello;
};

export function sellarCabeceraUsuarioEnOrigen(
  rows: readonly OrigenCorreoRenglon[],
  cabecera: CabeceraUsuarioSello,
): OrigenCorreoRenglon[] {
  const sello: CabeceraUsuarioSello = {
    notasGenerales: cabecera.notasGenerales.trim(),
    centroConsumo: cabecera.centroConsumo.trim(),
    referenciaPedido: cabecera.referenciaPedido.trim(),
    fechaEntrega: cabecera.fechaEntrega.trim(),
    direccionEntrega: cabecera.direccionEntrega.trim(),
    contacto: cabecera.contacto.trim(),
    telefono: cabecera.telefono.trim(),
    correo: cabecera.correo.trim(),
  };
  if (rows.length === 0) {
    return [
      {
        Producto: "",
        Cantidad: 0,
        _cabeceraUsuario: sello,
      } as OrigenCorreoConSello,
    ];
  }
  return rows.map((row) => ({
    ...row,
    _cabeceraUsuario: sello,
  }));
}

export function leerCabeceraUsuarioSello(
  rows: readonly OrigenCorreoRenglon[],
): CabeceraUsuarioSello | null {
  for (const row of rows) {
    const sello = (row as OrigenCorreoConSello)._cabeceraUsuario;
    if (sello && typeof sello === "object") {
      return {
        notasGenerales: String(sello.notasGenerales ?? "").trim(),
        centroConsumo: String(sello.centroConsumo ?? "").trim(),
        referenciaPedido: String(sello.referenciaPedido ?? "").trim(),
        fechaEntrega: String(sello.fechaEntrega ?? "").trim(),
        direccionEntrega: String(sello.direccionEntrega ?? "").trim(),
        contacto: String(sello.contacto ?? "").trim(),
        telefono: String(sello.telefono ?? "").trim(),
        correo: String(sello.correo ?? "").trim(),
      };
    }
  }
  return null;
}

/** Valor de formulario: con sello manda el sello; si no, BD y luego Mateo. */
export function resolveCampoConSelloUsuario(params: {
  sello: CabeceraUsuarioSello | null;
  key: keyof CabeceraUsuarioSello;
  guardadoBd: string;
  propuestaMateo: string;
}): string {
  if (params.sello) return params.sello[params.key];
  const bd = params.guardadoBd.trim();
  if (bd) return bd;
  return params.propuestaMateo.trim();
}

/** Arma el sello desde el estado del modal al guardar/confirmar. */
export function cabeceraUsuarioDesdeForm(params: {
  observaciones: string;
  centroConsumo: string;
  referenciaPedido?: string | null;
  fechaEntrega: string;
  direccion: string;
  contacto: string;
  telefono: string;
  correo: string;
}): CabeceraUsuarioSello {
  return {
    notasGenerales: params.observaciones,
    centroConsumo: params.centroConsumo,
    referenciaPedido: (params.referenciaPedido ?? "").trim(),
    fechaEntrega: params.fechaEntrega,
    direccionEntrega: params.direccion,
    contacto: params.contacto,
    telefono: params.telefono,
    correo: params.correo,
  };
}

/**
 * Alinea hijas/renglones con el sello para que la reinyección de OT
 * (`aplicar-reagrupacion-ov`) no vuelva a meter valores de Mateo.
 */
export function aplicarSelloCabeceraAHijas<
  T extends {
    almacen: string;
    referenciaPedido: string;
    fecha: string;
    responsableExterno: string;
    renglones: OrigenCorreoRenglon[];
  },
>(hijas: readonly T[], sello: CabeceraUsuarioSello): T[] {
  return hijas.map((hija) => ({
    ...hija,
    almacen: sello.centroConsumo,
    referenciaPedido: sello.referenciaPedido || hija.referenciaPedido,
    fecha: sello.fechaEntrega || hija.fecha,
    responsableExterno: sello.contacto,
    renglones: hija.renglones.map((row) => ({
      ...row,
      Almacen: sello.centroConsumo,
      "Referencia pedido": sello.referenciaPedido,
      Fecha: sello.fechaEntrega || row.Fecha,
      "Responsable externo": sello.contacto,
      "Telefono contacto": sello.telefono,
      "Correo contacto": sello.correo,
      "Direccion entrega": sello.direccionEntrega,
      "Notas generales": sello.notasGenerales,
      _cabeceraUsuario: sello,
    })),
  }));
}
