import type { OrdenVentaLineaInput } from "../../../shared/types/sales.types";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";
import type { OrigenAdjunto } from "../origen/origen-adjuntos";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { overrideDenominacionParaPersistir } from "./resolve-denominacion-comercial";
import { cabeceraUsuarioDesdeForm } from "./sellar-edicion-usuario-origen";
import {
  buildPayloadEnvioOv,
  notasLineasParaEnvio,
  origenCorreoParaEnvio,
} from "./payload-envio-ov";

/** Payload de guardar/confirmar + sello REQ-281. */
export function armarPayloadEnvioConSelloUsuario(params: {
  codigoCuenta: string;
  lineasParsed: OrdenVentaLineaInput[];
  lineas: readonly LineaVentaForm[];
  hijasSynced: readonly OrdenTrabajoHija[];
  origenCorreoDraft: OrigenCorreoRenglon[];
  idBodegaDestino: string;
  idComprador: string;
  fechaEntregaPersist: string;
  ventanaDesde: string;
  ventanaHasta: string;
  prioridad: string;
  moneda: string;
  ordenCompraHotel: string;
  centroConsumo: string;
  vendedorNombre: string;
  bodegaDestinoLabel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  turno: string;
  horaSalida: string;
  chofer: string;
  unidad: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  persistOrigenTexto: string;
  persistOrigenAdjuntos: OrigenAdjunto[];
  compradorNombreIa: string | null;
  compradorLabel: string;
  observaciones: string;
  idCreador: string;
  isDraft: boolean;
  denominacionComercial?: string | null;
  denominacionComercialCatalogo?: string | null;
}) {
  const notasLineasText = notasLineasParaEnvio(params.lineas);
  return buildPayloadEnvioOv({
    codigoCuenta: params.codigoCuenta,
    lineas: params.lineasParsed,
    idBodegaDestino: params.idBodegaDestino,
    idComprador: params.idComprador,
    fechaEntrega: params.fechaEntregaPersist,
    ventanaDesde: params.ventanaDesde,
    ventanaHasta: params.ventanaHasta,
    prioridad: params.prioridad,
    moneda: params.moneda,
    ordenCompraHotel: params.ordenCompraHotel,
    centroConsumo: params.centroConsumo,
    vendedor: params.vendedorNombre,
    bodegaDestinoLabel: params.bodegaDestinoLabel,
    direccion: params.direccion,
    anden: params.anden,
    contacto: params.contacto,
    telefono: params.telefono,
    correo: params.correo,
    turno: params.turno,
    horaSalida: params.horaSalida,
    chofer: params.chofer,
    unidad: params.unidad,
    aceptaSustituciones: params.aceptaSustituciones,
    requiereLote: params.requiereLote,
    registrarTemperatura: params.registrarTemperatura,
    origenTexto: params.persistOrigenTexto,
    origenArchivos: params.persistOrigenAdjuntos,
    origenCorreo: origenCorreoParaEnvio({
      hijas: params.hijasSynced,
      lineas: params.lineas,
      origenCorreoDraft: params.origenCorreoDraft,
      idComprador: params.idComprador,
      compradorNombreIa: params.compradorNombreIa,
      compradorLabel: params.compradorLabel,
      cabeceraUsuario: cabeceraUsuarioDesdeForm({
        observaciones: params.observaciones,
        centroConsumo: params.centroConsumo,
        referenciaPedido: params.hijasSynced
          .map((hija) => hija.referenciaPedido?.trim())
          .find(Boolean),
        fechaEntrega: params.fechaEntregaPersist,
        direccion: params.direccion,
        contacto: params.contacto,
        telefono: params.telefono,
        correo: params.correo,
      }),
    }),
    notasLineas: notasLineasText,
    observaciones: params.observaciones,
    idCreador: params.idCreador,
    isDraft: params.isDraft,
    denominacionComercialOverride: overrideDenominacionParaPersistir({
      valorFormulario: params.denominacionComercial ?? "",
      apodoSincronizado: params.denominacionComercialCatalogo ?? "",
    }),
  });
}
