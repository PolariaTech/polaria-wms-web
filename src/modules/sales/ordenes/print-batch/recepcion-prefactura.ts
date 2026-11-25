export const RUTA_RECEPCION_PREFACTURA = "/recepcion-prefactura";

export const DECISIONES_RECEPCION = [
  {
    valor: "aceptar",
    etiqueta: "Aceptar",
    pregunta: "¿Estás de acuerdo con aceptar esta prefactura?",
  },
  {
    valor: "parcial",
    etiqueta: "Aceptado parcial",
    pregunta: "¿Estás de acuerdo con registrar un aceptado parcial?",
  },
  {
    valor: "rechazado",
    etiqueta: "Rechazado",
    pregunta: "¿Estás de acuerdo con rechazar esta prefactura?",
  },
] as const;

export type DecisionRecepcion = (typeof DECISIONES_RECEPCION)[number]["valor"];

const MENSAJE_SIN_OPCION = "Elige Aceptar, Aceptado parcial o Rechazado.";

export interface PantallaRecepcionPrefactura {
  nombreEmpresa: string;
  cliente: string;
  numeroOt: string;
  totalOt: string;
  centroConsumo: string;
}

function asignarParam(params: URLSearchParams, clave: string, valor: string): void {
  const limpio = valor.trim();
  if (limpio) params.set(clave, limpio);
}

export function urlRecepcionPrefactura(
  origin: string,
  empresa: string,
  ov: string,
  ot: string,
  pantalla?: PantallaRecepcionPrefactura,
): string {
  const base = origin.replace(/\/+$/, "");
  const params = new URLSearchParams({
    empresa: empresa.trim(),
    ov: ov.trim(),
    ot: ot.trim(),
  });
  if (pantalla) {
    asignarParam(params, "nombre", pantalla.nombreEmpresa);
    asignarParam(params, "cliente", pantalla.cliente);
    asignarParam(params, "otn", pantalla.numeroOt);
    asignarParam(params, "ott", pantalla.totalOt);
    asignarParam(params, "centro", pantalla.centroConsumo);
  }
  return `${base}${RUTA_RECEPCION_PREFACTURA}?${params.toString()}`;
}

/** El número de la OT (pedido), no su posición entre las demás. */
export function etiquetaNumeroOt(numero: string): string {
  return numero.trim();
}

export function preguntaRecepcion(decision: string): string | null {
  const elegida = DECISIONES_RECEPCION.find((opcion) => opcion.valor === decision);
  return elegida?.pregunta ?? null;
}

export function validarDecisionRecepcion(decision: string): string | null {
  return preguntaRecepcion(decision) ? null : MENSAJE_SIN_OPCION;
}

function textoParam(valor: string | string[] | undefined): string {
  const crudo = Array.isArray(valor) ? valor[0] : valor;
  return crudo?.trim() ?? "";
}

export interface RecepcionPrefacturaEnlace {
  empresa: string;
  ov: string;
  ot: string;
  nombreEmpresa: string;
  cliente: string;
  numeroOt: string;
  totalOt: string;
  centroConsumo: string;
}

export function leerRecepcionQuery(query: {
  empresa?: string | string[];
  ov?: string | string[];
  ot?: string | string[];
  nombre?: string | string[];
  cliente?: string | string[];
  otn?: string | string[];
  ott?: string | string[];
  centro?: string | string[];
}): RecepcionPrefacturaEnlace | null {
  const empresa = textoParam(query.empresa);
  const ov = textoParam(query.ov);
  const ot = textoParam(query.ot);
  if (!empresa || !ov || !ot) return null;
  return {
    empresa,
    ov,
    ot,
    nombreEmpresa: textoParam(query.nombre),
    cliente: textoParam(query.cliente),
    numeroOt: textoParam(query.otn),
    totalOt: textoParam(query.ott),
    centroConsumo: textoParam(query.centro),
  };
}
