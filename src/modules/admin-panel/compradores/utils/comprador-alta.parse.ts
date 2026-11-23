import type { CompradorAltaCentro, CompradorAltaContacto, CompradorAltaFicha } from "./comprador-alta.types";

const EMPTY_FICHA: CompradorAltaFicha = {
  razonSocial: "",
  rfc: "",
  regimen: "",
  cpFiscal: "",
  usoCfdi: "",
  constanciaNombre: "",
  constanciaFecha: "",
  apodo: "",
  grupo: "",
  vendedor: "",
  estado: "",
  listaPrecios: "",
  diasCredito: "",
  limiteCredito: "",
  metodoPago: "",
  formaPago: "",
  moneda: "",
  exigeOc: "",
  correosCfdi: "",
  complementoPago: false,
  centros: [],
  contactos: [],
  whatsapp: "",
  formatoPedido: "",
  correosPedido: "",
  portalProveedores: false,
  portalNota: "",
  sustituciones: "",
  tolerancia: "",
  vidaUtil: "",
  requiereLote: "",
  requiereTemp: "",
  requiereFicha: "",
  politicaDevolucion: "",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function parseCentro(value: unknown): CompradorAltaCentro | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    nombre: asString(row.nombre),
    dias: asString(row.dias),
    direccion: asString(row.direccion),
    cp: asString(row.cp),
    anden: asString(row.anden),
    desde: asString(row.desde),
    hasta: asString(row.hasta),
    contacto: asString(row.contacto),
    telefono: asString(row.telefono),
    carreteraFederal: asString(row.carreteraFederal),
    notas: asString(row.notas),
  };
}

function parseContacto(value: unknown): CompradorAltaContacto | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    nombre: asString(row.nombre),
    puesto: asString(row.puesto),
    rol: asString(row.rol),
    telefono: asString(row.telefono),
    correo: asString(row.correo),
  };
}

export function emptyCompradorAltaFicha(): CompradorAltaFicha {
  return {
    ...EMPTY_FICHA,
    centros: [],
    contactos: [],
  };
}

export function parseCompradorAltaFicha(value: unknown): CompradorAltaFicha {
  if (!value || typeof value !== "object") {
    return emptyCompradorAltaFicha();
  }

  const row = value as Record<string, unknown>;
  const centros = Array.isArray(row.centros)
    ? row.centros.map(parseCentro).filter((item): item is CompradorAltaCentro => item !== null)
    : [];
  const contactos = Array.isArray(row.contactos)
    ? row.contactos
        .map(parseContacto)
        .filter((item): item is CompradorAltaContacto => item !== null)
    : [];

  return {
    razonSocial: asString(row.razonSocial),
    rfc: asString(row.rfc),
    regimen: asString(row.regimen),
    cpFiscal: asString(row.cpFiscal),
    usoCfdi: asString(row.usoCfdi),
    constanciaNombre: asString(row.constanciaNombre),
    constanciaFecha: asString(row.constanciaFecha),
    apodo: asString(row.apodo),
    grupo: asString(row.grupo),
    vendedor: asString(row.vendedor),
    estado: asString(row.estado),
    listaPrecios: asString(row.listaPrecios),
    diasCredito: asString(row.diasCredito),
    limiteCredito: asString(row.limiteCredito),
    metodoPago: asString(row.metodoPago),
    formaPago: asString(row.formaPago),
    moneda: asString(row.moneda),
    exigeOc: asString(row.exigeOc),
    correosCfdi: asString(row.correosCfdi),
    complementoPago: asBoolean(row.complementoPago),
    centros,
    contactos,
    whatsapp: asString(row.whatsapp),
    formatoPedido: asString(row.formatoPedido),
    correosPedido: asString(row.correosPedido),
    portalProveedores: asBoolean(row.portalProveedores),
    portalNota: asString(row.portalNota),
    sustituciones: asString(row.sustituciones),
    tolerancia: asString(row.tolerancia),
    vidaUtil: asString(row.vidaUtil),
    requiereLote: asString(row.requiereLote),
    requiereTemp: asString(row.requiereTemp),
    requiereFicha: asString(row.requiereFicha),
    politicaDevolucion: asString(row.politicaDevolucion),
  };
}

export function displayAltaValue(value: string | boolean | undefined): string {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  const trimmed = value?.trim() ?? "";
  return trimmed || "—";
}
