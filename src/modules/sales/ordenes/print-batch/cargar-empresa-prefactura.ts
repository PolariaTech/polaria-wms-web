import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { runDomainQuery } from "@/lib/supabase/domain-query";

export interface LogoPrefactura {
  bytes: Uint8Array;
  formato: "PNG" | "JPEG";
}

export interface EmpresaPrefactura {
  razonSocial: string;
  rfc: string | null;
  regimenFiscal: string | null;
  codigoPostalExpedicion: string | null;
  nombreCuentaBancaria: string | null;
  banco: string | null;
  clabe: string | null;
  correoCobranza: string | null;
  serieFactura: string | null;
  logo: LogoPrefactura | null;
}

interface EmpresaImpresionRow {
  razon_social: string;
  rfc: string | null;
  regimen_fiscal: string | null;
  codigo_postal_expedicion: string | null;
  nombre_cuenta_bancaria: string | null;
  banco: string | null;
  clabe: string | null;
  correo_cobranza: string | null;
  serie_factura: string | null;
  logo_path: string | null;
}

const COLUMNAS =
  "razon_social,rfc,regimen_fiscal,codigo_postal_expedicion,nombre_cuenta_bancaria,banco,clabe,correo_cobranza,serie_factura,logo_path";

export async function bajarLogoEmpresa(ruta: string): Promise<LogoPrefactura> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/empresa-logo?path=${encodeURIComponent(ruta)}`);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "sin respuesta";
    throw new Error(`No se pudo leer el logo de la empresa. ${detalle}`);
  }
  if (!respuesta.ok) throw new Error("No se pudo leer el logo de la empresa.");
  const tipo = respuesta.headers.get("content-type") ?? "";
  const formato = tipo.includes("png") || ruta.toLowerCase().endsWith(".png") ? "PNG" : "JPEG";
  return { bytes: new Uint8Array(await respuesta.arrayBuffer()), formato };
}

function filaEmpresa(data: EmpresaImpresionRow | EmpresaImpresionRow[] | null): EmpresaImpresionRow | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

async function leerFicha(codigoEmpresa: string): Promise<EmpresaImpresionRow> {
  let data: EmpresaImpresionRow | EmpresaImpresionRow[] | null;
  try {
    data = await runDomainQuery<EmpresaImpresionRow | EmpresaImpresionRow[] | null>((client) => {
      const query = client.from("empresa").select(COLUMNAS).eq("codigo_empresa", codigoEmpresa).maybeSingle();
      return query as unknown as Promise<{ data: EmpresaImpresionRow | null; error: { message: string } | null }>;
    });
  } catch (error) {
    const detalle = error instanceof DomainServiceError ? error.message : "Error al consultar.";
    throw new Error(`No se pudo leer la empresa. ${detalle}`);
  }
  const fila = filaEmpresa(data);
  if (!fila?.razon_social) throw new Error("No se encontró la empresa para la prefactura.");
  return fila;
}

/** Ficha fiscal de public.empresa. Sin logo_path el PDF sale igual, sin imagen. */
export async function cargarEmpresaPrefactura(
  codigoEmpresa: string,
  bajarLogo: (ruta: string) => Promise<LogoPrefactura> = bajarLogoEmpresa,
): Promise<EmpresaPrefactura> {
  const codigo = codigoEmpresa.trim();
  if (!codigo) throw new Error("No se encontró la empresa de la sesión.");
  const fila = await leerFicha(codigo);
  const logo = fila.logo_path?.trim() ? await bajarLogo(fila.logo_path.trim()) : null;
  return {
    razonSocial: fila.razon_social,
    rfc: fila.rfc,
    regimenFiscal: fila.regimen_fiscal,
    codigoPostalExpedicion: fila.codigo_postal_expedicion,
    nombreCuentaBancaria: fila.nombre_cuenta_bancaria,
    banco: fila.banco,
    clabe: fila.clabe,
    correoCobranza: fila.correo_cobranza,
    serieFactura: fila.serie_factura,
    logo,
  };
}
