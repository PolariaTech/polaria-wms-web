import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "../utils/origen/origen-correo-ordenes-trabajo";

export const ETAPAS_PREFACTURA = ["confirmada", "alistada", "despachada"] as const;

export const TIPO_PREFACTURA_IMPRESA = "impresion_prefactura";
export const TIPO_PREFACTURA_ACEPTADA = "prefactura_aceptada";

export const MENSAJE_ETAPAS_PREFACTURA =
  "La orden no ha pasado por Confirmada, Alistado y Despachado. No se puede facturar.";

const TIPOS_IMPRESION = new Set([
  TIPO_PREFACTURA_IMPRESA,
  "impresion_pdf",
  "impresion_pdf_auto",
]);

export interface FilaPrefactura {
  id: string;
  numero: string;
  centro: string;
}

/** Código corto de almacén (`ARSE`, `FYV`, `AR87`) pegado delante del nombre. */
function esCodigoDeCentro(token: string): boolean {
  return /^[A-Z0-9]{2,4}$/.test(token);
}

/** «ARSE Room Service» → «Room Service». Un nombre sin código («COCINA CENTRAL») se queda igual. */
export function nombreDeCentro(valor: string): string {
  const texto = valor.trim().replace(/\s+/g, " ");
  const partes = texto.split(" ");
  let inicio = 0;
  while (inicio < partes.length - 1 && esCodigoDeCentro(partes[inicio] ?? "")) inicio += 1;
  return partes.slice(inicio).join(" ");
}

export function filasPrefactura(
  origen: unknown,
  respaldo: string,
  centroRespaldo = "",
): FilaPrefactura[] {
  const hijas = groupOrigenCorreoToOrdenesTrabajo(parseOrigenCorreoJson(origen));
  const centroOrden = nombreDeCentro(centroRespaldo);
  if (hijas.length === 0) {
    return [{ id: "unica", numero: respaldo.trim() || "OT", centro: centroOrden }];
  }
  return hijas.map((hija, indice) => {
    const centro = nombreDeCentro(hija.almacen.trim() || centroRespaldo);
    const pedido = hija.numeroPedido.trim();
    const numero = pedido && pedido !== centro ? pedido : `OT ${indice + 1}`;
    return { id: hija.id, numero, centro };
  });
}

export function estadosRecorridos(
  payloads: readonly Record<string, unknown>[],
): Set<string> {
  const vistos = new Set<string>();
  for (const payload of payloads) {
    for (const clave of ["estadoNuevo", "estado"]) {
      const valor = payload[clave];
      if (typeof valor === "string" && valor.trim()) {
        vistos.add(normalizeEstadoOrdenVenta(valor));
      }
    }
  }
  return vistos;
}

export function puedeConfirmarPrefactura(
  estado: string,
  recorridos: ReadonlySet<string>,
): boolean {
  const actual = normalizeEstadoOrdenVenta(estado);
  if (actual !== "despachada" && actual !== "facturada") return false;
  return ETAPAS_PREFACTURA.every((etapa) => recorridos.has(etapa));
}

export function otMarcada(
  payloads: readonly Record<string, unknown>[],
  otId: string,
  tipos: ReadonlySet<string>,
): boolean {
  const id = otId.trim();
  return payloads.some((payload) => {
    const tipo = typeof payload.tipo === "string" ? payload.tipo.trim() : "";
    if (!tipos.has(tipo)) return false;
    const ligada = typeof payload.idOrdenTrabajo === "string" ? payload.idOrdenTrabajo.trim() : "";
    return !ligada || ligada === id;
  });
}

export function otImpresa(payloads: readonly Record<string, unknown>[], otId: string): boolean {
  return otMarcada(payloads, otId, TIPOS_IMPRESION);
}

export function otAprobada(payloads: readonly Record<string, unknown>[], otId: string): boolean {
  return otMarcada(payloads, otId, new Set([TIPO_PREFACTURA_ACEPTADA]));
}

export function todasAprobadas(
  filas: readonly FilaPrefactura[],
  payloads: readonly Record<string, unknown>[],
  otRecienAceptada: string,
): boolean {
  return filas.every(
    (fila) => fila.id === otRecienAceptada.trim() || otAprobada(payloads, fila.id),
  );
}
