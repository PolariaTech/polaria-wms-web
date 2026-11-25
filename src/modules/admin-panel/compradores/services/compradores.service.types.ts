import { emptyCompradorAltaFicha, type CompradorAltaFicha } from "../utils/comprador-alta";

export interface CompradorListRow {
  idComprador: string;
  codigo: string;
  comprador: string;
  /** Nombre comercial corto (columna BD `apodo`). Override WMS: `denominacionComercialOverride` (REQ-241). */
  apodo: string; denominacionComercialOverride?: string;
  telefono: string | null;
  /** RFC fiscal (puede ir vacío). */
  rfc: string;
  /** Grupo perteneciente (marca), desde catálogo tmp / BD. */
  grupo: string;
  /** false = deshabilitado: visible en tablas, oculto en formularios. */
  estaActivo: boolean;
}

export interface CompradorDetalleRow extends CompradorListRow {
  ficha: CompradorAltaFicha;
}

export interface CompradorDbRow {
  id_comprador: string;
  codigo: string;
  nombre: string;
  telefono: string | null;
  esta_activo?: boolean | null;

  // Campos “flatten” del formulario nuevo (no JSON).
  razon_social?: string | null;
  rfc?: string | null;
  regimen?: string | null;
  cp_fiscal?: string | null;
  uso_cfdi?: string | null;
  constancia_nombre?: string | null;
  constancia_fecha?: string | null;
  apodo?: string | null; denominacion_comercial_override?: string | null;
  grupo?: string | null;
  vendedor?: string | null;
  estado?: string | null;
  lista_precios?: string | null;
  dias_credito?: string | null;
  limite_credito?: string | null;
  metodo_pago?: string | null;
  forma_pago?: string | null;
  moneda?: string | null;
  exige_oc?: string | null;
  correos_cfdi?: string | null;
  complemento_pago?: boolean | null;
  whatsapp?: string | null;
  formato_pedido?: string | null;
  correos_pedido?: string | null;
  portal_proveedores?: boolean | null;
  portal_nota?: string | null;
  sustituciones?: string | null;
  tolerancia?: string | null;
  vida_util?: string | null;
  requiere_lote?: string | null;
  requiere_temp?: string | null;
  requiere_ficha?: string | null;
  politica_devolucion?: string | null;

  // Centro (1er centro).
  centro_nombre?: string | null;
  centro_dias?: string | null;
  centro_direccion?: string | null;
  centro_cp?: string | null;
  centro_anden?: string | null;
  centro_desde?: string | null;
  centro_hasta?: string | null;
  centro_contacto?: string | null;
  centro_telefono?: string | null;
  centro_carretera_federal?: string | null;
  centro_notas?: string | null;

  // Contacto (1er contacto).
  contacto_nombre?: string | null;
  contacto_puesto?: string | null;
  contacto_rol?: string | null;
  contacto_telefono?: string | null;
  contacto_correo?: string | null;
}

export const COMPRADOR_LIST_COLUMNS =
  "id_comprador,codigo,nombre,apodo,denominacion_comercial_override,telefono,rfc,grupo,esta_activo";
export const COMPRADOR_DETALLE_COLUMNS = [
  COMPRADOR_LIST_COLUMNS,
  // Campos fiscales/comerciales.
  "razon_social",
  "rfc",
  "regimen",
  "cp_fiscal",
  "uso_cfdi",
  "constancia_nombre",
  "constancia_fecha",
  "apodo",
  "grupo",
  "vendedor",
  "estado",
  "lista_precios",
  "dias_credito",
  "limite_credito",
  "metodo_pago",
  "forma_pago",
  "moneda",
  "exige_oc",
  "correos_cfdi",
  "complemento_pago",
  "whatsapp",
  "formato_pedido",
  "correos_pedido",
  "portal_proveedores",
  "portal_nota",
  "sustituciones",
  "tolerancia",
  "vida_util",
  "requiere_lote",
  "requiere_temp",
  "requiere_ficha",
  "politica_devolucion",
  // Centro (1er).
  "centro_nombre",
  "centro_dias",
  "centro_direccion",
  "centro_cp",
  "centro_anden",
  "centro_desde",
  "centro_hasta",
  "centro_contacto",
  "centro_telefono",
  "centro_carretera_federal",
  "centro_notas",
  // Contacto (1er).
  "contacto_nombre",
  "contacto_puesto",
  "contacto_rol",
  "contacto_telefono",
  "contacto_correo",
].join(",");

export function mapCompradorRow(row: CompradorDbRow): CompradorListRow {
  return {
    idComprador: row.id_comprador,
    codigo: row.codigo,
    comprador: row.nombre,
    apodo: valueOrEmpty(row.apodo), denominacionComercialOverride: valueOrEmpty(row.denominacion_comercial_override),
    telefono: row.telefono,
    rfc: valueOrEmpty(row.rfc),
    grupo: valueOrEmpty(row.grupo),
    estaActivo: row.esta_activo !== false,
  };
}

export function mapCompradorDetalle(row: CompradorDbRow): CompradorDetalleRow {
  return {
    ...mapCompradorRow(row),
    ficha: buildCompradorAltaFichaFromColumns(row),
  };
}

export function valueOrEmpty(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

export function valueOrDefaultBool(value: boolean | null | undefined, fallback: boolean): boolean {
  return value === true || value === false ? value : fallback;
}

export function buildCompradorAltaFichaFromColumns(
  row: CompradorDbRow,
): CompradorAltaFicha {
  const base = emptyCompradorAltaFicha();
  const ficha = {
    ...base,
    razonSocial: valueOrEmpty(row.razon_social),
    rfc: valueOrEmpty(row.rfc),
    regimen: valueOrEmpty(row.regimen),
    cpFiscal: valueOrEmpty(row.cp_fiscal),
    usoCfdi: valueOrEmpty(row.uso_cfdi),
    constanciaNombre: valueOrEmpty(row.constancia_nombre),
    constanciaFecha: valueOrEmpty(row.constancia_fecha),
    apodo: valueOrEmpty(row.apodo),
    grupo: valueOrEmpty(row.grupo),
    vendedor: valueOrEmpty(row.vendedor),
    estado: valueOrEmpty(row.estado),
    listaPrecios: valueOrEmpty(row.lista_precios),
    diasCredito: valueOrEmpty(row.dias_credito),
    limiteCredito: valueOrEmpty(row.limite_credito),
    metodoPago: valueOrEmpty(row.metodo_pago),
    formaPago: valueOrEmpty(row.forma_pago),
    moneda: valueOrEmpty(row.moneda),
    exigeOc: valueOrEmpty(row.exige_oc),
    correosCfdi: valueOrEmpty(row.correos_cfdi),
    complementoPago: valueOrDefaultBool(row.complemento_pago, base.complementoPago),
    whatsapp: valueOrEmpty(row.whatsapp),
    formatoPedido: valueOrEmpty(row.formato_pedido),
    correosPedido: valueOrEmpty(row.correos_pedido),
    portalProveedores: valueOrDefaultBool(row.portal_proveedores, base.portalProveedores),
    portalNota: valueOrEmpty(row.portal_nota),
    sustituciones: valueOrEmpty(row.sustituciones),
    tolerancia: valueOrEmpty(row.tolerancia),
    vidaUtil: valueOrEmpty(row.vida_util),
    requiereLote: valueOrEmpty(row.requiere_lote),
    requiereTemp: valueOrEmpty(row.requiere_temp),
    requiereFicha: valueOrEmpty(row.requiere_ficha),
    politicaDevolucion: valueOrEmpty(row.politica_devolucion),
    centros: [
      {
        nombre: valueOrEmpty(row.centro_nombre),
        dias: valueOrEmpty(row.centro_dias),
        direccion: valueOrEmpty(row.centro_direccion),
        cp: valueOrEmpty(row.centro_cp),
        anden: valueOrEmpty(row.centro_anden),
        desde: valueOrEmpty(row.centro_desde),
        hasta: valueOrEmpty(row.centro_hasta),
        contacto: valueOrEmpty(row.centro_contacto),
        telefono: valueOrEmpty(row.centro_telefono),
        carreteraFederal:
          valueOrEmpty(row.centro_carretera_federal) ||
          "No — entrega urbana local",
        notas: valueOrEmpty(row.centro_notas),
      },
    ],
    contactos: [
      {
        nombre: valueOrEmpty(row.contacto_nombre),
        puesto: valueOrEmpty(row.contacto_puesto),
        rol: valueOrEmpty(row.contacto_rol) || "Hace pedidos",
        telefono: valueOrEmpty(row.contacto_telefono),
        correo: valueOrEmpty(row.contacto_correo),
      },
    ],
  } satisfies CompradorAltaFicha;

  return ficha;
}

export interface ListCompradoresParams {
  codigoCuenta: string;
  limit?: number;
  /**
   * true (default): solo activos → formularios/selectores.
   * false: incluye deshabilitados → tablas de administración.
   */
  soloActivos?: boolean;
}
