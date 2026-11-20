import { formatIsoToDdMonYyyy } from "@/lib/utils/fecha-dd-mm-yyyy";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import type { EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { pesosALetra } from "./pesos-a-letra";

const REGIMENES: Record<string, string> = {
  "601": "General de Ley Personas Morales",
  "603": "Personas Morales con Fines no Lucrativos",
  "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "606": "Arrendamiento",
  "612": "Personas Físicas con Actividades Empresariales y Profesionales",
  "616": "Sin obligaciones fiscales",
  "621": "Incorporación Fiscal",
  "626": "Régimen Simplificado de Confianza",
};

export interface PartidaPrefactura {
  cantidad: string;
  unidad: string;
  descripcion: string;
  valorUnitario: string;
  importe: string;
}

export interface FiscalCompradorPrefactura {
  regimenFiscal: string;
  domicilioFiscal: string;
  metodoPago: string;
  formaPago: string;
}

export const FISCAL_COMPRADOR_VACIO: FiscalCompradorPrefactura = {
  regimenFiscal: "",
  domicilioFiscal: "",
  metodoPago: "",
  formaPago: "",
};

export interface PrefacturaDocumento {
  razonSocial: string;
  rfc: string;
  regimen: string;
  codigoPostal: string;
  serie: string;
  folio: string;
  fecha: string;
  cliente: string;
  rfcCliente: string;
  regimenComprador: string;
  domicilioFiscal: string;
  metodoPago: string;
  formaPago: string;
  domicilio: string;
  moneda: string;
  referencia: string;
  realizo: string;
  cuenta: string;
  banco: string;
  clabe: string;
  correo: string;
  partidas: PartidaPrefactura[];
  subtotal: string;
  total: string;
  totalLetra: string;
  logo: EmpresaPrefactura["logo"];
}

export function etiquetaRegimen(codigo: string | null): string {
  const limpio = codigo?.trim() ?? "";
  if (!limpio) return "";
  const nombre = REGIMENES[limpio];
  return nombre ? `${limpio} · ${nombre}` : limpio;
}

export function dinero(valor: number): string {
  return valor.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dia(valor: string | null | undefined): string {
  const iso = valor?.trim().slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? formatIsoToDdMonYyyy(iso) : "";
}

function texto(valor: string | null | undefined): string {
  return valor?.trim() ?? "";
}

function partidaDe(linea: OrdenVentaDetalleRow["lineas"][number]): { partida: PartidaPrefactura; importe: number } {
  const cantidad = Number.isFinite(linea.cantidad_pedida) ? linea.cantidad_pedida : 0;
  const precio = Number.isFinite(linea.precio_unitario) ? linea.precio_unitario : 0;
  const importe = Math.round(cantidad * precio * 100) / 100;
  return {
    importe,
    partida: {
      cantidad: String(Math.round(cantidad * 1000) / 1000),
      unidad: texto(linea.unidad_medida) || "KGM",
      descripcion: texto(linea.producto?.descripcion) || texto(linea.producto?.sku) || "Partida",
      valorUnitario: dinero(precio),
      importe: dinero(importe),
    },
  };
}

/** Arma una prefactura con la ficha de public.empresa y el detalle de la OV del schema actual. */
export function documentoPrefactura(
  empresa: EmpresaPrefactura,
  detalle: OrdenVentaDetalleRow,
  fiscal: FiscalCompradorPrefactura = FISCAL_COMPRADOR_VACIO,
): PrefacturaDocumento {
  const partidas = detalle.lineas.map(partidaDe);
  if (partidas.length === 0) {
    throw new Error(`La orden ${detalle.codigo} no tiene partidas para la prefactura.`);
  }
  const total = Math.round(partidas.reduce((suma, item) => suma + item.importe, 0) * 100) / 100;
  return {
    razonSocial: empresa.razonSocial,
    rfc: texto(empresa.rfc),
    regimen: etiquetaRegimen(empresa.regimenFiscal),
    codigoPostal: texto(empresa.codigoPostalExpedicion),
    serie: texto(empresa.serieFactura),
    folio: detalle.codigo,
    fecha: dia(detalle.fecha_pedido) || dia(detalle.fecha_entrega),
    cliente: texto(detalle.comprador_razon_social) || texto(detalle.comprador_nombre) || "Cliente",
    rfcCliente: texto(detalle.comprador_rfc),
    regimenComprador: texto(fiscal.regimenFiscal),
    domicilioFiscal: texto(fiscal.domicilioFiscal),
    metodoPago: texto(fiscal.metodoPago),
    formaPago: texto(fiscal.formaPago),
    domicilio: texto(detalle.direccion_entrega),
    moneda: texto(detalle.moneda) || "MXN",
    referencia: texto(detalle.orden_compra_hotel) || detalle.codigo,
    realizo: texto(detalle.vendedor),
    cuenta: texto(empresa.nombreCuentaBancaria),
    banco: texto(empresa.banco),
    clabe: texto(empresa.clabe),
    correo: texto(empresa.correoCobranza),
    partidas: partidas.map((item) => item.partida),
    subtotal: dinero(total),
    total: dinero(total),
    totalLetra: pesosALetra(total),
    logo: empresa.logo,
  };
}
