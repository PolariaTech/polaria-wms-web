export interface CompradorAltaCentro {
  nombre: string;
  dias: string;
  direccion: string;
  cp: string;
  anden: string;
  desde: string;
  hasta: string;
  contacto: string;
  telefono: string;
  carreteraFederal: string;
  notas: string;
}

export interface CompradorAltaContacto {
  nombre: string;
  puesto: string;
  rol: string;
  telefono: string;
  correo: string;
}

export interface CompradorAltaFicha {
  razonSocial: string;
  rfc: string;
  regimen: string;
  cpFiscal: string;
  usoCfdi: string;
  constanciaNombre: string;
  constanciaFecha: string;
  apodo: string;
  grupo: string;
  vendedor: string;
  estado: string;
  listaPrecios: string;
  diasCredito: string;
  limiteCredito: string;
  metodoPago: string;
  formaPago: string;
  moneda: string;
  exigeOc: string;
  correosCfdi: string;
  complementoPago: boolean;
  centros: CompradorAltaCentro[];
  contactos: CompradorAltaContacto[];
  whatsapp: string;
  formatoPedido: string;
  correosPedido: string;
  portalProveedores: boolean;
  portalNota: string;
  sustituciones: string;
  tolerancia: string;
  vidaUtil: string;
  requiereLote: string;
  requiereTemp: string;
  requiereFicha: string;
  politicaDevolucion: string;
}

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

export type CompradorAltaCentroRow = CompradorAltaCentro & { key: string };
export type CompradorAltaContactoRow = CompradorAltaContacto & { key: string };

export type CompradorAltaFormFicha = Omit<CompradorAltaFicha, "centros" | "contactos"> & {
  centros: CompradorAltaCentroRow[];
  contactos: CompradorAltaContactoRow[];
};

export interface CompradorAltaFormState {
  nombreComercial: string;
  telefono: string;
  ficha: CompradorAltaFormFicha;
}

function altaRowKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `alta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyAltaCentroRow(): CompradorAltaCentroRow {
  return {
    key: altaRowKey(),
    nombre: "",
    dias: "",
    direccion: "",
    cp: "",
    anden: "",
    desde: "",
    hasta: "",
    contacto: "",
    telefono: "",
    carreteraFederal: "No — entrega urbana local",
    notas: "",
  };
}

export function emptyAltaContactoRow(): CompradorAltaContactoRow {
  return {
    key: altaRowKey(),
    nombre: "",
    puesto: "",
    rol: "Hace pedidos",
    telefono: "",
    correo: "",
  };
}

export function emptyAltaFormState(vendedor = ""): CompradorAltaFormState {
  return {
    nombreComercial: "",
    telefono: "",
    ficha: {
      razonSocial: "",
      rfc: "",
      regimen: "",
      cpFiscal: "",
      usoCfdi: "G01 — Adquisición de mercancías",
      constanciaNombre: "",
      constanciaFecha: "",
      apodo: "",
      grupo: "",
      vendedor,
      estado: "Activo",
      listaPrecios: "",
      diasCredito: "30",
      limiteCredito: "",
      metodoPago: "PPD — Parcialidades o diferido",
      formaPago: "03 — Transferencia electrónica",
      moneda: "MXN",
      exigeOc: "Sí",
      correosCfdi: "",
      complementoPago: false,
      centros: [emptyAltaCentroRow()],
      contactos: [emptyAltaContactoRow()],
      whatsapp: "",
      formatoPedido: "Texto libre",
      correosPedido: "",
      portalProveedores: false,
      portalNota: "",
      sustituciones: "No — surtir parcial",
      tolerancia: "",
      vidaUtil: "",
      requiereLote: "Sí",
      requiereTemp: "Sí",
      requiereFicha: "No",
      politicaDevolucion: "",
    },
  };
}

function filledText(value: string, fallback: string): string {
  return value.trim() ? value : fallback;
}

export function altaFormStateFromDetalle(
  nombreComercial: string,
  telefono: string,
  ficha: CompradorAltaFicha,
  vendedorFallback = "",
): CompradorAltaFormState {
  const base = emptyAltaFormState(vendedorFallback);
  const centros = ficha.centros.map((row) => ({ ...row, key: altaRowKey() }));
  const contactos = ficha.contactos.map((row) => ({ ...row, key: altaRowKey() }));
  return {
    nombreComercial,
    telefono,
    ficha: {
      ...base.ficha,
      razonSocial: filledText(ficha.razonSocial, base.ficha.razonSocial),
      rfc: filledText(ficha.rfc, base.ficha.rfc),
      regimen: filledText(ficha.regimen, base.ficha.regimen),
      cpFiscal: filledText(ficha.cpFiscal, base.ficha.cpFiscal),
      usoCfdi: filledText(ficha.usoCfdi, base.ficha.usoCfdi),
      constanciaNombre: filledText(ficha.constanciaNombre, base.ficha.constanciaNombre),
      constanciaFecha: filledText(ficha.constanciaFecha, base.ficha.constanciaFecha),
      apodo: filledText(ficha.apodo, base.ficha.apodo),
      grupo: filledText(ficha.grupo, base.ficha.grupo),
      vendedor: filledText(ficha.vendedor, vendedorFallback),
      estado: filledText(ficha.estado, base.ficha.estado),
      listaPrecios: filledText(ficha.listaPrecios, base.ficha.listaPrecios),
      diasCredito: filledText(ficha.diasCredito, base.ficha.diasCredito),
      limiteCredito: filledText(ficha.limiteCredito, base.ficha.limiteCredito),
      metodoPago: filledText(ficha.metodoPago, base.ficha.metodoPago),
      formaPago: filledText(ficha.formaPago, base.ficha.formaPago),
      moneda: filledText(ficha.moneda, base.ficha.moneda),
      exigeOc: filledText(ficha.exigeOc, base.ficha.exigeOc),
      correosCfdi: filledText(ficha.correosCfdi, base.ficha.correosCfdi),
      complementoPago: ficha.complementoPago,
      whatsapp: filledText(ficha.whatsapp, base.ficha.whatsapp),
      formatoPedido: filledText(ficha.formatoPedido, base.ficha.formatoPedido),
      correosPedido: filledText(ficha.correosPedido, base.ficha.correosPedido),
      portalProveedores: ficha.portalProveedores,
      portalNota: filledText(ficha.portalNota, base.ficha.portalNota),
      sustituciones: filledText(ficha.sustituciones, base.ficha.sustituciones),
      tolerancia: filledText(ficha.tolerancia, base.ficha.tolerancia),
      vidaUtil: filledText(ficha.vidaUtil, base.ficha.vidaUtil),
      requiereLote: filledText(ficha.requiereLote, base.ficha.requiereLote),
      requiereTemp: filledText(ficha.requiereTemp, base.ficha.requiereTemp),
      requiereFicha: filledText(ficha.requiereFicha, base.ficha.requiereFicha),
      politicaDevolucion: filledText(
        ficha.politicaDevolucion,
        base.ficha.politicaDevolucion,
      ),
      centros: centros.length > 0 ? centros : [emptyAltaCentroRow()],
      contactos: contactos.length > 0 ? contactos : [emptyAltaContactoRow()],
    },
  };
}

export function fichaFromAltaForm(form: CompradorAltaFormState): CompradorAltaFicha {
  return {
    ...form.ficha,
    centros: form.ficha.centros.map(({ key: _key, ...row }) => row),
    contactos: form.ficha.contactos.map(({ key: _key, ...row }) => row),
  };
}
