import type {
  CompradorAltaCentroRow,
  CompradorAltaContactoRow,
  CompradorAltaFicha,
  CompradorAltaFormFicha,
  CompradorAltaFormState,
} from "./comprador-alta.types";
import { emptyCompradorAltaFicha } from "./comprador-alta.parse";

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
