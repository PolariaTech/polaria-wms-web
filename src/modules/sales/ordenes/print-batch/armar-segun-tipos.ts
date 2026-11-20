import { useAuthStore } from "@/stores/auth.store";
import { getOrdenVentaDetalle } from "../../shared/services/sales.service";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import { armarPartePdf } from "./armar-parte-pdf";
import { armarPreviaRapida, type EntradaPreviaRapida } from "./armar-previa-rapida";
import type { ResumenOvBatch } from "./batch-seleccion";
import { cargarCompradorPrefactura } from "./cargar-comprador-prefactura";
import { cargarEmpresaPrefactura, type EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { cargarHojasBatch, type CargarHojasBatchInput } from "./cargar-hojas-batch";
import { documentoPrefactura, type FiscalCompradorPrefactura } from "./prefactura-documento";
import { previaSoloPrefacturas, sumarPrefacturas, type AnexoPrefactura } from "./pegar-prefacturas";
import { renderPrefacturasPdf } from "./render-prefactura-pdf";
import type { TipoDocumentoRapida } from "./ImpresionRapidaTipos";
import { nombreArchivoBatch, type PreviaBatch } from "./utilidades-batch";

type Ejecutar = <T>(tarea: () => Promise<T>) => Promise<T>;

export interface EntradaSegunTipos {
  tipos: ReadonlySet<TipoDocumentoRapida>;
  codigoCuenta: string;
  fecha: string;
  zonaHoraria: string;
  resumen: ResumenOvBatch[];
  runScoped: Ejecutar;
  alProgreso: (texto: string) => void;
  codigoEmpresa?: string;
  leerEmpresa?: (codigo: string) => Promise<EmpresaPrefactura>;
  leerDetalle?: (idOrdenVenta: string) => Promise<OrdenVentaDetalleRow>;
  leerComprador?: (idComprador: string | null) => Promise<FiscalCompradorPrefactura>;
}

function codigoEmpresaDeSesion(explicito: string | undefined): string {
  const estado = useAuthStore.getState();
  const deSesion = estado.session?.codigoEmpresa ?? estado.context?.codigoEmpresa;
  const codigo = (explicito ?? deSesion ?? "").trim();
  if (!codigo) throw new Error("No se encontró la empresa de la sesión.");
  return codigo;
}

async function previaDeHojas(entrada: EntradaSegunTipos): Promise<PreviaBatch> {
  const conOc = entrada.tipos.has("oc");
  const origenPorOv = new Map<string, string | null | undefined>();
  const hojas = await cargarHojasBatch(hojasInput(entrada, conOc, origenPorOv));
  if (hojas.length === 0) throw new Error("No hay hojas para las OT de estas órdenes.");
  return armarPreviaRapida(rapidaInput(entrada, hojas, conOc, origenPorOv));
}

function hojasInput(entrada: EntradaSegunTipos, conOc: boolean, origenPorOv: Map<string, string | null | undefined>): CargarHojasBatchInput {
  return {
    codigoCuenta: entrada.codigoCuenta,
    resumen: entrada.resumen,
    zonaHoraria: entrada.zonaHoraria,
    runScoped: entrada.runScoped,
    orden: "resumen",
    onProgreso: (leidas, total) => entrada.alProgreso(`Leyendo OV ${leidas} de ${total}…`),
    alLeerDetalle: conOc ? (id, origen) => origenPorOv.set(id, origen) : undefined,
  };
}

function rapidaInput(entrada: EntradaSegunTipos, hojas: Awaited<ReturnType<typeof cargarHojasBatch>>, conOc: boolean, origenPorOv: Map<string, string | null | undefined>): EntradaPreviaRapida {
  return {
    codigoCuenta: entrada.codigoCuenta,
    fecha: entrada.fecha,
    zonaHoraria: entrada.zonaHoraria,
    hojas,
    resumen: entrada.resumen,
    conOc,
    origenPorOv,
    alProgreso: entrada.alProgreso,
  };
}

async function detalleDe(entrada: EntradaSegunTipos, item: ResumenOvBatch): Promise<OrdenVentaDetalleRow> {
  try {
    if (entrada.leerDetalle) return await entrada.leerDetalle(item.row.idOrdenVenta);
    return await entrada.runScoped(() => getOrdenVentaDetalle({ codigoCuenta: entrada.codigoCuenta, idOrdenVenta: item.row.idOrdenVenta }));
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "Error al consultar.";
    throw new Error(`No se pudo leer ${item.row.venta} para la prefactura. ${detalle}`);
  }
}

async function fiscalDe(entrada: EntradaSegunTipos, detalle: OrdenVentaDetalleRow): Promise<FiscalCompradorPrefactura> {
  if (entrada.leerComprador) return entrada.leerComprador(detalle.id_comprador);
  return entrada.runScoped(() => cargarCompradorPrefactura(detalle.id_comprador));
}

async function anexoDe(entrada: EntradaSegunTipos, empresa: EmpresaPrefactura, item: ResumenOvBatch): Promise<AnexoPrefactura> {
  const detalle = await detalleDe(entrada, item);
  const doc = renderPrefacturasPdf([documentoPrefactura(empresa, detalle, await fiscalDe(entrada, detalle))]);
  return { idOrdenVenta: item.row.idOrdenVenta, pdf: new Blob([doc.output("arraybuffer")], { type: "application/pdf" }) };
}

async function anexosDe(entrada: EntradaSegunTipos): Promise<AnexoPrefactura[]> {
  const empresa = await (entrada.leerEmpresa ?? cargarEmpresaPrefactura)(codigoEmpresaDeSesion(entrada.codigoEmpresa));
  const anexos: AnexoPrefactura[] = [];
  for (let i = 0; i < entrada.resumen.length; i += 1) {
    const item = entrada.resumen[i]!;
    entrada.alProgreso(`Armando prefactura ${i + 1} de ${entrada.resumen.length}…`);
    anexos.push(await anexoDe(entrada, empresa, item));
  }
  return anexos;
}

/** Arma la impresión rápida según los tipos marcados. Sin OT, el paquete son solo las prefacturas. */
export async function armarSegunTipos(entrada: EntradaSegunTipos): Promise<PreviaBatch> {
  const conPrefactura = entrada.tipos.has("factura");
  const conHojas = entrada.tipos.has("ot") || entrada.tipos.has("oc");
  if (!conHojas && !conPrefactura) throw new Error("Elige al menos un tipo de documento.");
  if (!conHojas) return previaSoloPrefacturas(entrada.resumen, await anexosDe(entrada), nombreArchivoBatch());
  const previa = await previaDeHojas(entrada);
  if (!conPrefactura) return previa;
  return sumarPrefacturas(previa, await anexosDe(entrada), (parte, indice, total) =>
    armarPartePdf({
      parte,
      indice,
      total,
      resumenPdf: previa.resumenPdf,
      codigoCuenta: entrada.codigoCuenta,
    }),
  );
}
