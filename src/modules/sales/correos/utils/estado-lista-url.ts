import type { FiltrosCorreos } from "../types/correos.types";

const MAX_TEXTO = 120;
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface EstadoListaCorreos {
  pagina: number;
  filtros: FiltrosCorreos;
}

function leerPagina(valor: string | null): number {
  if (!valor || !/^\d+$/.test(valor)) return 1;
  const pagina = Number(valor);
  return pagina >= 1 ? pagina : 1;
}

function leerTexto(valor: string | null): string {
  if (!valor) return "";
  return valor.slice(0, MAX_TEXTO);
}

function leerFecha(valor: string | null): string {
  if (!valor) return "";
  const partes = FECHA.exec(valor);
  if (!partes) return "";
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return "";
  return valor;
}

export function leerEstadoLista(
  params: Pick<URLSearchParams, "get">,
): EstadoListaCorreos {
  return {
    pagina: leerPagina(params.get("pagina")),
    filtros: {
      remitente: leerTexto(params.get("remitente")),
      asunto: leerTexto(params.get("asunto")),
      desde: leerFecha(params.get("desde")),
      hasta: leerFecha(params.get("hasta")),
    },
  };
}

export function escribirEstadoLista(estado: EstadoListaCorreos): string {
  const params = new URLSearchParams();
  if (estado.pagina > 1) params.set("pagina", String(estado.pagina));
  if (estado.filtros.remitente) params.set("remitente", estado.filtros.remitente);
  if (estado.filtros.asunto) params.set("asunto", estado.filtros.asunto);
  if (estado.filtros.desde) params.set("desde", estado.filtros.desde);
  if (estado.filtros.hasta) params.set("hasta", estado.filtros.hasta);
  return params.toString();
}
