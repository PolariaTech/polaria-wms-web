import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { runDomainQuery } from "@/lib/supabase/domain-query";
import { FISCAL_COMPRADOR_VACIO, type FiscalCompradorPrefactura } from "./prefactura-documento";

interface CompradorFiscalRow {
  regimen: string | null;
  cp_fiscal: string | null;
  metodo_pago: string | null;
  forma_pago: string | null;
}

const COLUMNAS = "regimen,cp_fiscal,metodo_pago,forma_pago";

function texto(valor: string | null | undefined): string {
  return valor?.trim() ?? "";
}

function deFila(fila: CompradorFiscalRow | null): FiscalCompradorPrefactura {
  if (!fila) return { ...FISCAL_COMPRADOR_VACIO };
  return {
    regimenFiscal: texto(fila.regimen),
    domicilioFiscal: texto(fila.cp_fiscal),
    metodoPago: texto(fila.metodo_pago),
    formaPago: texto(fila.forma_pago),
  };
}

async function leerFila(idComprador: string): Promise<CompradorFiscalRow | null> {
  try {
    return await runDomainQuery<CompradorFiscalRow | null>((client) => {
      const query = client.from("comprador").select(COLUMNAS).eq("id_comprador", idComprador).maybeSingle();
      return query as unknown as Promise<{ data: CompradorFiscalRow | null; error: { message: string } | null }>;
    });
  } catch (error) {
    const detalle = error instanceof DomainServiceError ? error.message : "Error al consultar.";
    throw new Error(`No se pudo leer el comprador de la prefactura. ${detalle}`);
  }
}

/** Régimen, CP fiscal y pago del comprador. Sin id, la prefactura sale con esos campos vacíos. */
export async function cargarCompradorPrefactura(idComprador: string | null | undefined): Promise<FiscalCompradorPrefactura> {
  const id = idComprador?.trim() ?? "";
  if (!id) return { ...FISCAL_COMPRADOR_VACIO };
  return deFila(await leerFila(id));
}
