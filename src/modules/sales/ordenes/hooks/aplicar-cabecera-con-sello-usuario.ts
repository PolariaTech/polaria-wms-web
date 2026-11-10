import { extractCorreoContactoDesdeTexto } from "../utils/origen/correo-chrome";
import { resolveFechaEntregaDesdeOrigen } from "../utils/origen/materialize-ov-desde-origen";
import { sanitizeNotasGeneralesPedido } from "../utils/origen/texto-origen-pedido";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import type { OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  stripSurtidoFotoQrFromNotas,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { isFechaEntregaIsoValida } from "../utils/pedido/pedido-form-validation";
import { resolveCabeceraGuardada } from "../utils/pedido/resolve-cabecera-guardada";
import { resolveOccCampoFormulario } from "../utils/pedido/occ-alineada-listado-ov";
import {
  aplicarSelloCabeceraAHijas,
  leerCabeceraUsuarioSello,
  resolveCampoConSelloUsuario,
} from "../utils/pedido/sellar-edicion-usuario-origen";
import { sanitizeTelefonoContacto } from "../utils/pedido/sanitize-telefono-contacto";
import { toDateInputValue } from "../utils/pedido/orden-venta-create-helpers";

type DetalleCabecera = {
  notas_almacen?: string | null;
  observaciones?: string | null;
  orden_compra_hotel?: string | null;
  origen_texto?: string | null;
  origen_correo?: unknown;
  centro_consumo?: string | null;
  direccion_entrega?: string | null;
  contacto_entrega?: string | null;
  telefono_contacto?: string | null;
  correo_contacto?: string | null;
  fecha_entrega?: string | null;
};

type MappedCabecera = {
  centroConsumo: string;
  observaciones: string;
  ordenCompraHotel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  fechaEntrega: string;
};

/** REQ-281: resuelve cabecera del form respetando el sello del usuario. */
export function resolverCabeceraFormConSelloUsuario(params: {
  origenCorreoRows: OrigenCorreoRenglon[];
  detalle: DetalleCabecera;
  mapped: MappedCabecera;
  hijasEdit: OrdenTrabajoHija[];
  telefonoForMap: string;
}): {
  selloUsuario: ReturnType<typeof leerCabeceraUsuarioSello>;
  hijasParaForm: OrdenTrabajoHija[];
  fechaEntrega: string;
  centroConsumo: string;
  observaciones: string;
  ordenCompraHotel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
} {
  const { origenCorreoRows, detalle, mapped, hijasEdit, telefonoForMap } =
    params;
  const selloUsuario = leerCabeceraUsuarioSello(origenCorreoRows);
  const cabecera = resolveCabeceraGuardada({
    detalle,
    filasOrigen: origenCorreoRows,
    propuesta: mapped,
  });
  const fechaDb = toDateInputValue(detalle.fecha_entrega);
  const fechaMapped = isFechaEntregaIsoValida(mapped.fechaEntrega)
    ? mapped.fechaEntrega.trim()
    : "";
  const fechaOrigen = resolveFechaEntregaDesdeOrigen({
    origenCorreo: origenCorreoRows,
    hijas: hijasEdit,
  });
  const fechaResuelta = resolveCampoConSelloUsuario({
    sello: selloUsuario,
    key: "fechaEntrega",
    guardadoBd: isFechaEntregaIsoValida(fechaDb) ? fechaDb : "",
    propuestaMateo: fechaOrigen || fechaMapped || "",
  });

  return {
    selloUsuario,
    hijasParaForm: selloUsuario
      ? aplicarSelloCabeceraAHijas(hijasEdit, selloUsuario)
      : hijasEdit,
    fechaEntrega: fechaResuelta,
    centroConsumo: resolveCampoConSelloUsuario({
      sello: selloUsuario,
      key: "centroConsumo",
      guardadoBd: detalle.centro_consumo?.trim() || "",
      propuestaMateo: mapped.centroConsumo,
    }),
    observaciones: selloUsuario
      ? selloUsuario.notasGenerales
      : cabecera.observaciones,
    ordenCompraHotel: resolveOccCampoFormulario({
      ordenCompraHotelGuardada:
        cabecera.ordenCompraHotel || detalle.orden_compra_hotel,
      propuestaMateo: mapped.ordenCompraHotel,
      origenTexto: detalle.origen_texto,
      origenCorreo: detalle.origen_correo ?? origenCorreoRows,
    }),
    direccion: resolveCampoConSelloUsuario({
      sello: selloUsuario,
      key: "direccionEntrega",
      guardadoBd: detalle.direccion_entrega?.trim() || "",
      propuestaMateo: mapped.direccion,
    }),
    anden: mapped.anden,
    contacto: resolveCampoConSelloUsuario({
      sello: selloUsuario,
      key: "contacto",
      guardadoBd: detalle.contacto_entrega?.trim() || "",
      propuestaMateo: mapped.contacto,
    }),
    telefono: sanitizeTelefonoContacto(
      resolveCampoConSelloUsuario({
        sello: selloUsuario,
        key: "telefono",
        guardadoBd: detalle.telefono_contacto?.trim() || "",
        propuestaMateo: mapped.telefono || telefonoForMap,
      }),
    ),
    correo: resolveCampoConSelloUsuario({
      sello: selloUsuario,
      key: "correo",
      guardadoBd: detalle.correo_contacto?.trim() || "",
      propuestaMateo:
        mapped.correo.trim() ||
        extractCorreoContactoDesdeTexto(detalle.origen_texto) ||
        "",
    }),
  };
}

/** Notas al cargar detalle (ruta no-Mateo): sin re-extraer si hay sello. */
export function notasCanonConSelloUsuario(params: {
  origenCorreoRows: OrigenCorreoRenglon[];
  notasAlmacen: string;
  observacionesOv: string | null | undefined;
  origenTexto: string | null | undefined;
}): string {
  const sello = leerCabeceraUsuarioSello(params.origenCorreoRows);
  if (sello) return sello.notasGenerales;
  return sanitizeNotasGeneralesPedido(
    stripSurtidoFotoQrFromNotas(params.notasAlmacen) ||
      params.observacionesOv ||
      "",
    params.origenTexto,
  );
}
