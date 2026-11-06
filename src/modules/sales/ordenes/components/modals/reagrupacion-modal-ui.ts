import { cn } from "@/lib/utils/cn";
import type { CriterioDivision } from "../../services/reagrupar-ot.client";
import type { PropuestaCorreccionCorreoApi } from "../../utils/ot/aplicar-correccion-correo";

/** Presentación compartida del modal de reorganizar: botones y textos del resumen. */

export const BOTON_SECUNDARIO = cn(
  "min-h-11 rounded-xl border border-polaria-w-08 px-5 py-2.5",
  "text-sm font-medium text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

export const BOTON_PRIMARIO = cn(
  "inline-flex min-h-11 min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
  "text-sm font-semibold text-polaria-on-teal transition hover:opacity-90 lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** Frase del resumen con singular y plural correctos. */
export function describirCambioDeOt(nuevas: number, vacias: number): string {
  const partes: string[] = [];
  if (nuevas > 0) {
    partes.push(
      nuevas === 1 ? "Se crea 1 OT nueva." : `Se crean ${nuevas} OT nuevas.`,
    );
  }
  if (vacias > 0) {
    partes.push(
      vacias === 1
        ? "Se une 1 OT que queda sin productos."
        : `Se unen ${vacias} OT que quedan sin productos.`,
    );
  }
  return partes.length > 0 ? `${partes.join(" ")} ` : "";
}

export function formatearCantidad(cantidad: number | string): string {
  const numero = typeof cantidad === "number" ? cantidad : Number(cantidad);
  return Number.isFinite(numero)
    ? numero.toLocaleString("es-MX", { maximumFractionDigits: 3 })
    : String(cantidad);
}

const NOMBRE_DEL_CRITERIO: Record<CriterioDivision, string> = {
  oc: "orden de compra",
  dia: "día de entrega",
  horario: "horario de entrega",
};

export function nombreDelCriterio(criterio: CriterioDivision): string {
  return NOMBRE_DEL_CRITERIO[criterio];
}

/**
 * Título del plan de división. Cada valor que sale es una orden de venta nueva; lo que se
 * queda sigue junto en la actual, que cuenta como una sola.
 */
export function tituloDeLaDivision(valoresSalen: number): string {
  return `La orden se divide en ${valoresSalen + 1} órdenes de venta`;
}

export function describirOrdenesNuevas(
  criterio: CriterioDivision,
  cantidad: number,
): string {
  return cantidad === 1
    ? "Pasa a una orden de venta nueva"
    : `Pasan a órdenes de venta nuevas, una por cada ${nombreDelCriterio(criterio)}`;
}

/** Un día `AAAA-MM-DD` se muestra como `DD-MM-AAAA`; cualquier otro texto se deja igual. */
function formatearDia(valor: string): string {
  const [, anio, mes, dia] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor) ?? [];
  return anio ? `${dia}-${mes}-${anio}` : valor;
}

/** Cómo se lee un valor del criterio en el plan (sin identificadores internos). */
export function etiquetaDeValor(criterio: CriterioDivision, valor: string): string {
  if (criterio === "oc") return `Orden de compra ${valor}`;
  if (criterio === "dia") return `Entrega del ${formatearDia(valor)}`;
  return `Entrega en el horario ${valor}`;
}

export const MENSAJE_FORMULARIO_CAMBIO =
  "El formulario cambió mientras se generaba la propuesta. Vuelve a generarla.";

/** Corrección contra el correo (REQ-187): leyendo los archivos o con la propuesta lista. */
export interface EstadoCorreccion {
  fase: "leyendo" | "propuesta";
  /** Lo que el servidor entendió de la instrucción. */
  motivo: string;
  /** Firma del formulario al pedirla; si cambia, la propuesta ya no aplica. */
  firmaBase: string;
  propuesta?: PropuestaCorreccionCorreoApi;
}
