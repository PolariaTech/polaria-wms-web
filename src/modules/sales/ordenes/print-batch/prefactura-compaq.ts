import { createHash } from "node:crypto";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  type OrigenCorreoRenglon,
} from "../utils/origen/origen-correo-ordenes-trabajo";

const MAX_CATALOGO = 30;
const MAX_REFERENCIA = 20;
const HUELLA_HOJA = 6;
const CODIGO_OV_CORTO = /^OV-\d{8}$/;

/** Almacén de Fruta Cancún en la base de prueba de Compaq. */
export const BODEGA_COMPAQ_PROVISIONAL = "8";

export const MENSAJE_OV_POR_CONFIRMAR =
  "Esta orden está por confirmar y todavía no tiene orden de trabajo. No se puede facturar.";

export const MENSAJE_OV_CODIGO_ANTIGUO =
  "Esta orden tiene un código antiguo y no se puede facturar.";

export interface PartidaPrefacturaCompaq {
  sku: string;
  bodega: string;
  cantidad: number;
  precio: number;
}

export interface CuerpoPrefacturaCompaq {
  fecha: string;
  cliente: string;
  referencia: string;
  partidas: PartidaPrefacturaCompaq[];
}

export interface LineaPrefacturaCompaq {
  textoCliente: string;
  sku: string;
  cantidad: number;
}

export interface DatosPrefacturaCompaq {
  fechaPedido: string;
  codigoCliente: string;
  codigoOv: string;
  ot: string;
  renglones: OrigenCorreoRenglon[];
  lineas: LineaPrefacturaCompaq[];
}

export interface ResultadoPrefacturaCompaq {
  ok: boolean;
  folio: number | null;
  serie: string;
  error: string | null;
}

type PedidoCompaq = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export function armarCuerpoPrefacturaCompaq(
  datos: DatosPrefacturaCompaq,
): { ok: true; cuerpo: CuerpoPrefacturaCompaq } | { ok: false; error: string } {
  const fecha = datos.fechaPedido.trim().slice(0, 10);
  if (!fechaReal(fecha)) return { ok: false, error: "La fecha del pedido no es válida." };
  const cliente = datos.codigoCliente.trim();
  if (!cliente || cliente.length > MAX_CATALOGO) {
    return { ok: false, error: "El cliente no tiene código de Compaq." };
  }
  const referenciaArmada = referenciaPrefactura(datos.codigoOv, datos.ot);
  if (!referenciaArmada.ok) return referenciaArmada;
  const bodega = BODEGA_COMPAQ_PROVISIONAL;
  const referencia = referenciaArmada.referencia;
  const partidas = partidasDe(datos, bodega);
  if ("error" in partidas) return partidas;
  return { ok: true, cuerpo: { fecha, cliente, referencia, partidas } };
}

export async function enviarPrefacturaCompaq(
  cuerpo: CuerpoPrefacturaCompaq,
  pedir: PedidoCompaq = fetch,
): Promise<ResultadoPrefacturaCompaq> {
  const url = process.env.COMPAC_PREFACTURA_URL?.trim();
  if (!url) {
    return fallo("Falta la URL de Compaq.");
  }
  try {
    const respuesta = await pedir(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(cuerpo),
    });
    return leerRespuestaCompaq(respuesta.status, await leerJson(respuesta));
  } catch {
    return fallo("No se pudo llamar a Compaq.");
  }
}

export function mensajeFacturado(resultado: ResultadoPrefacturaCompaq): string {
  const serie = resultado.serie.trim() || "CS-";
  const folio = resultado.folio === null ? "" : String(resultado.folio);
  return folio ? `Facturado. Folio ${serie}${folio}.` : "Facturado.";
}

export function referenciaPrefactura(
  codigoOv: string,
  idHoja: string,
): { ok: true; referencia: string } | { ok: false; error: string } {
  const codigo = codigoOv.trim();
  if (!CODIGO_OV_CORTO.test(codigo)) {
    return { ok: false, error: MENSAJE_OV_CODIGO_ANTIGUO };
  }
  const hoja = idHoja.trim();
  if (!hoja) return { ok: false, error: "No se identificó la hoja de la prefactura." };
  const referencia = `${codigo}${huellaHoja(hoja)}`;
  if (referencia.length > MAX_REFERENCIA) {
    return { ok: false, error: "La referencia de la prefactura no cabe en 20 caracteres." };
  }
  return { ok: true, referencia };
}

function huellaHoja(idHoja: string): string {
  return createHash("sha256").update(idHoja).digest("hex").slice(0, HUELLA_HOJA).toUpperCase();
}

function partidasDe(
  datos: DatosPrefacturaCompaq,
  bodega: string,
): PartidaPrefacturaCompaq[] | { ok: false; error: string } {
  const hijas = groupOrigenCorreoToOrdenesTrabajo(datos.renglones);
  const hija = hijas.find((item) => item.id === datos.ot);
  const renglones = hija?.renglones ?? [];
  if (renglones.length === 0) {
    return { ok: false, error: "La orden de tarea no tiene partidas." };
  }
  const partidas: PartidaPrefacturaCompaq[] = [];
  for (const renglon of renglones) {
    const partida = partidaDe(renglon, bodega, datos.lineas);
    if ("error" in partida) return partida;
    partidas.push(partida);
  }
  return partidas;
}

function skuDe(renglon: OrigenCorreoRenglon, lineas: LineaPrefacturaCompaq[]): string {
  const texto = (renglon.Producto ?? "").trim().toLowerCase();
  const cantidad = numero(renglon.Cantidad);
  const encontrada = lineas.find((linea) => {
    const mismoTexto = texto.length > 0 && linea.textoCliente.trim().toLowerCase() === texto;
    const mismaCantidad = cantidad === null || Math.abs(linea.cantidad - cantidad) < 0.001;
    const sku = linea.sku.trim();
    return mismoTexto && mismaCantidad && sku.length > 0 && !sku.toUpperCase().startsWith("ARCH-");
  });
  return encontrada?.sku.trim() || (renglon["Codigo producto"] ?? "").trim();
}

function partidaDe(
  renglon: OrigenCorreoRenglon,
  bodega: string,
  lineas: LineaPrefacturaCompaq[],
): PartidaPrefacturaCompaq | { ok: false; error: string } {
  const sku = skuDe(renglon, lineas);
  const cantidad = numero(renglon.Cantidad);
  const precio = numero(renglon.Precio);
  if (!sku || sku.length > MAX_CATALOGO) {
    return { ok: false, error: "Una partida no tiene código de producto." };
  }
  if (cantidad === null || cantidad <= 0) {
    return { ok: false, error: "Una partida no tiene cantidad." };
  }
  if (precio === null || precio < 0) {
    return { ok: false, error: "Una partida no tiene precio." };
  }
  return { sku, bodega, cantidad, precio };
}

function numero(valor: number | string | undefined): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;
  const convertido = Number(valor.replace(",", ".").trim());
  return Number.isFinite(convertido) ? convertido : null;
}

function fechaReal(valor: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return false;
  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
}

function leerRespuestaCompaq(status: number, cuerpo: unknown): ResultadoPrefacturaCompaq {
  const fila = cuerpo && typeof cuerpo === "object" ? (cuerpo as Record<string, unknown>) : {};
  const creada = fila.ok === true && status === 201;
  const duplicada = status === 409 && fila.codigo === "REFERENCIA_DUPLICADA";
  if (creada || duplicada) {
    return {
      ok: true,
      folio: typeof fila.folio === "number" ? fila.folio : null,
      serie: typeof fila.serie === "string" ? fila.serie : "CS-",
      error: null,
    };
  }
  const error = typeof fila.error === "string" && fila.error.trim()
    ? fila.error.trim()
    : "Compaq no creó la prefactura.";
  return fallo(error);
}

function fallo(error: string): ResultadoPrefacturaCompaq {
  return { ok: false, folio: null, serie: "", error };
}
