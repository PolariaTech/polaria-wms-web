import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/utils/generate-codigo-cuenta";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
import {
  emptyCompradorAltaFicha,
  type CompradorAltaFicha,
} from "../utils/comprador-alta";

export interface CompradorListRow {
  idComprador: string;
  codigo: string;
  comprador: string;
  telefono: string | null;
  /** false = deshabilitado: visible en tablas, oculto en formularios. */
  estaActivo: boolean;
}

export interface CompradorDetalleRow extends CompradorListRow {
  ficha: CompradorAltaFicha;
}

interface CompradorDbRow {
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
  apodo?: string | null;
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

const COMPRADOR_LIST_COLUMNS = "id_comprador,codigo,nombre,telefono,esta_activo";
const COMPRADOR_DETALLE_COLUMNS = [
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

function mapCompradorRow(row: CompradorDbRow): CompradorListRow {
  return {
    idComprador: row.id_comprador,
    codigo: row.codigo,
    comprador: row.nombre,
    telefono: row.telefono,
    estaActivo: row.esta_activo !== false,
  };
}

function mapCompradorDetalle(row: CompradorDbRow): CompradorDetalleRow {
  return {
    ...mapCompradorRow(row),
    ficha: buildCompradorAltaFichaFromColumns(row),
  };
}

function valueOrEmpty(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

function valueOrDefaultBool(value: boolean | null | undefined, fallback: boolean): boolean {
  return value === true || value === false ? value : fallback;
}

function buildCompradorAltaFichaFromColumns(
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

/** Lista compradores de la cuenta (scope tenant). */
export async function listCompradoresAdmin(
  params: ListCompradoresParams,
): Promise<CompradorListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const soloActivos = params.soloActivos !== false;

  const rows = await runDomainQuery<CompradorDbRow[]>((client) => {
    let query = client
      .from("comprador")
      .select(COMPRADOR_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta);

    if (soloActivos) {
      query = query.eq("esta_activo", true);
    }

    const finalQuery = query.order("nombre", { ascending: true }).limit(limit);

    return finalQuery as unknown as Promise<{
      data: CompradorDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapCompradorRow);
}

export interface GetCompradorParams {
  codigoCuenta: string;
  idComprador: string;
}

/** Detalle de un comprador activo, con ficha de alta. */
export async function getCompradorAdmin(
  params: GetCompradorParams,
): Promise<CompradorDetalleRow> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idComprador = params.idComprador.trim();

  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  const load = (columns: string) =>
    runDomainQuery<CompradorDbRow | null>((client) => {
      const query = client
        .from("comprador")
        .select(columns)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_comprador", idComprador)
        .eq("esta_activo", true)
        .maybeSingle();

      return query as unknown as Promise<{
        data: CompradorDbRow | null;
        error: { message: string } | null;
      }>;
    });

  const row = await load(COMPRADOR_DETALLE_COLUMNS);

  if (!row) {
    throw new DomainServiceError(
      "No se encontró el comprador.",
      "NOT_FOUND",
    );
  }

  return mapCompradorDetalle(row);
}

export interface CreateCompradorInput {
  codigoCuenta: string;
  nombre: string;
  telefono?: string | null;
  ficha?: CompradorAltaFicha | null;
}

/** Crea un comprador para la cuenta activa (scope tenant). */
export async function createCompradorAdmin(
  input: CreateCompradorInput,
): Promise<CompradorListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const nombre = input.nombre.trim();
  const telefonoRaw = input.telefono?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(nombre),
  );

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre del comprador es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (telefonoRaw && !isValidInternationalPhone(telefonoRaw)) {
    throw new DomainServiceError(
      "El teléfono del comprador no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  const ficha = input.ficha ?? null;
  const payload: Record<string, unknown> = {
    codigo_cuenta: codigoCuenta,
    codigo,
    nombre,
    telefono,
    esta_activo: true,
  };

  if (ficha) {
    payload.razon_social = ficha.razonSocial;
    payload.rfc = ficha.rfc;
    payload.regimen = ficha.regimen;
    payload.cp_fiscal = ficha.cpFiscal;
    payload.uso_cfdi = ficha.usoCfdi;
    payload.constancia_nombre = ficha.constanciaNombre;
    payload.constancia_fecha = ficha.constanciaFecha;
    payload.apodo = ficha.apodo;
    payload.grupo = ficha.grupo;
    payload.vendedor = ficha.vendedor;
    payload.estado = ficha.estado;
    payload.lista_precios = ficha.listaPrecios;
    payload.dias_credito = ficha.diasCredito;
    payload.limite_credito = ficha.limiteCredito;
    payload.metodo_pago = ficha.metodoPago;
    payload.forma_pago = ficha.formaPago;
    payload.moneda = ficha.moneda;
    payload.exige_oc = ficha.exigeOc;
    payload.correos_cfdi = ficha.correosCfdi;
    payload.complemento_pago = ficha.complementoPago;
    payload.whatsapp = ficha.whatsapp;
    payload.formato_pedido = ficha.formatoPedido;
    payload.correos_pedido = ficha.correosPedido;
    payload.portal_proveedores = ficha.portalProveedores;
    payload.portal_nota = ficha.portalNota;
    payload.sustituciones = ficha.sustituciones;
    payload.tolerancia = ficha.tolerancia;
    payload.vida_util = ficha.vidaUtil;
    payload.requiere_lote = ficha.requiereLote;
    payload.requiere_temp = ficha.requiereTemp;
    payload.requiere_ficha = ficha.requiereFicha;
    payload.politica_devolucion = ficha.politicaDevolucion;

    const centro = ficha.centros?.[0];
    if (centro) {
      payload.centro_nombre = centro.nombre;
      payload.centro_dias = centro.dias;
      payload.centro_direccion = centro.direccion;
      payload.centro_cp = centro.cp;
      payload.centro_anden = centro.anden;
      payload.centro_desde = centro.desde;
      payload.centro_hasta = centro.hasta;
      payload.centro_contacto = centro.contacto;
      payload.centro_telefono = centro.telefono;
      payload.centro_carretera_federal = centro.carreteraFederal;
      payload.centro_notas = centro.notas;
    }

    const contacto = ficha.contactos?.[0];
    if (contacto) {
      payload.contacto_nombre = contacto.nombre;
      payload.contacto_puesto = contacto.puesto;
      payload.contacto_rol = contacto.rol;
      payload.contacto_telefono = contacto.telefono;
      payload.contacto_correo = contacto.correo;
    }
  }

  const insertComprador = (body: Record<string, unknown>, columns: string) =>
    runDomainMutation<CompradorDbRow | null>((client) => {
      const query = client
        .from("comprador")
        .insert(body)
        .select(columns)
        .single();

      return query as unknown as Promise<{
        data: CompradorDbRow | null;
        error: { message: string } | null;
      }>;
    });

  let inserted: CompradorDbRow | null;
  inserted = await insertComprador(payload, COMPRADOR_LIST_COLUMNS);

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el comprador.",
      "MUTATION_FAILED",
    );
  }

  return mapCompradorRow(inserted);
}

export interface UpdateCompradorInput {
  codigoCuenta: string;
  idComprador: string;
  nombre: string;
  telefono?: string | null;
  ficha?: CompradorAltaFicha | null;
}

/** Actualiza un comprador de la cuenta activa (scope tenant). */
export async function updateCompradorAdmin(
  input: UpdateCompradorInput,
): Promise<CompradorListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  const nombre = input.nombre.trim();
  const telefonoRaw = input.telefono?.trim() ?? "";

  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre del comprador es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (telefonoRaw && !isValidInternationalPhone(telefonoRaw)) {
    throw new DomainServiceError(
      "El teléfono del comprador no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  const ficha = input.ficha ?? null;
  const payload: Record<string, unknown> = {
    nombre,
    telefono,
  };

  if (ficha) {
    payload.razon_social = ficha.razonSocial;
    payload.rfc = ficha.rfc;
    payload.regimen = ficha.regimen;
    payload.cp_fiscal = ficha.cpFiscal;
    payload.uso_cfdi = ficha.usoCfdi;
    payload.constancia_nombre = ficha.constanciaNombre;
    payload.constancia_fecha = ficha.constanciaFecha;
    payload.apodo = ficha.apodo;
    payload.grupo = ficha.grupo;
    payload.vendedor = ficha.vendedor;
    payload.estado = ficha.estado;
    payload.lista_precios = ficha.listaPrecios;
    payload.dias_credito = ficha.diasCredito;
    payload.limite_credito = ficha.limiteCredito;
    payload.metodo_pago = ficha.metodoPago;
    payload.forma_pago = ficha.formaPago;
    payload.moneda = ficha.moneda;
    payload.exige_oc = ficha.exigeOc;
    payload.correos_cfdi = ficha.correosCfdi;
    payload.complemento_pago = ficha.complementoPago;
    payload.whatsapp = ficha.whatsapp;
    payload.formato_pedido = ficha.formatoPedido;
    payload.correos_pedido = ficha.correosPedido;
    payload.portal_proveedores = ficha.portalProveedores;
    payload.portal_nota = ficha.portalNota;
    payload.sustituciones = ficha.sustituciones;
    payload.tolerancia = ficha.tolerancia;
    payload.vida_util = ficha.vidaUtil;
    payload.requiere_lote = ficha.requiereLote;
    payload.requiere_temp = ficha.requiereTemp;
    payload.requiere_ficha = ficha.requiereFicha;
    payload.politica_devolucion = ficha.politicaDevolucion;

    const centro = ficha.centros?.[0];
    if (centro) {
      payload.centro_nombre = centro.nombre;
      payload.centro_dias = centro.dias;
      payload.centro_direccion = centro.direccion;
      payload.centro_cp = centro.cp;
      payload.centro_anden = centro.anden;
      payload.centro_desde = centro.desde;
      payload.centro_hasta = centro.hasta;
      payload.centro_contacto = centro.contacto;
      payload.centro_telefono = centro.telefono;
      payload.centro_carretera_federal = centro.carreteraFederal;
      payload.centro_notas = centro.notas;
    }

    const contacto = ficha.contactos?.[0];
    if (contacto) {
      payload.contacto_nombre = contacto.nombre;
      payload.contacto_puesto = contacto.puesto;
      payload.contacto_rol = contacto.rol;
      payload.contacto_telefono = contacto.telefono;
      payload.contacto_correo = contacto.correo;
    }
  }

  const updateComprador = (body: Record<string, unknown>) =>
    runDomainMutation<CompradorDbRow | null>((client) => {
      const query = client
        .from("comprador")
        .update(body)
        .eq("id_comprador", idComprador)
        .eq("codigo_cuenta", codigoCuenta)
        .select(COMPRADOR_LIST_COLUMNS)
        .single();

      return query as unknown as Promise<{
        data: CompradorDbRow | null;
        error: { message: string } | null;
      }>;
    });

  const updated = await updateComprador(payload);

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo actualizar el comprador.",
      "MUTATION_FAILED",
    );
  }

  return mapCompradorRow(updated);
}

export interface DeactivateCompradorParams {
  codigoCuenta: string;
  idComprador: string;
}

/** Deshabilita un comprador (baja lógica). Sigue en tablas; sale de formularios. */
export async function deactivateCompradorAdmin(
  params: DeactivateCompradorParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idComprador = params.idComprador.trim();

  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("comprador")
      .update({ esta_activo: false })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_comprador", idComprador);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}

/** Reactiva un comprador deshabilitado. */
export async function activateCompradorAdmin(
  params: DeactivateCompradorParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idComprador = params.idComprador.trim();

  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("comprador")
      .update({ esta_activo: true })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_comprador", idComprador);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}
