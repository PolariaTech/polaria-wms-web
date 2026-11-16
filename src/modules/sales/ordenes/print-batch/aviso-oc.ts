import { NOTA_OC_EN_OTRA_OV } from "./quitar-oc-repetidas";
import type { PreviaBatch } from "./utilidades-batch";

/** Cuántas OV se nombran en el aviso; el resto se cuenta. El detalle completo está en la hoja de notas. */
const MAX_OV_NOMBRADAS = 5;
/** La nota que `armarResumenImpresion` escribe para una OV sin ningún adjunto imprimible. */
const NOTA_SIN_OC = "no tiene OC para imprimir";

export interface AvisoOcSinImprimir {
  titulo: string;
  detalle: string;
}

/**
 * Qué decirle al operador, antes de imprimir, sobre las OV que salen sin orden de compra (REQ-260):
 * las que no tienen ningún adjunto HTML, PDF o Excel (o ninguno que se pudiera convertir) y los
 * archivos que no se pudieron bajar o convertir. Sus órdenes de tarea sí salen. Sin OC marcadas, o si
 * todas traen su OC, no hay nada que avisar. Una OV cuya OC ya salió con una OV hermana (REQ-313) no
 * es una OV sin OC, y esa nota no cuenta como archivo que falló.
 */
export function avisoDeOcSinImprimir(previa: Pick<PreviaBatch, "resumenPdf" | "partes">): AvisoOcSinImprimir | null {
  const resumen = previa.resumenPdf;
  if (!resumen || !(previa.partes ?? []).some((parte) => parte.pdf)) return null;

  const notas = resumen.notas ?? [];
  const esRepetida = (nota: string): boolean => nota.includes(NOTA_OC_EN_OTRA_OV);
  const soloRepetidas = (venta: string): boolean => {
    const propias = notas.filter((nota) => nota.startsWith(`${venta}: `));
    return propias.length > 0 && propias.every(esRepetida);
  };
  const sinOc = resumen.filas.filter((fila) => !fila.oc && !soloRepetidas(fila.venta)).map((fila) => fila.venta);
  const fallidos = notas.filter((nota) => !nota.includes(NOTA_SIN_OC) && !esRepetida(nota)).length;
  if (sinOc.length === 0 && fallidos === 0) return null;

  const archivos = `${fallidos} ${fallidos === 1 ? "archivo de OC no se pudo" : "archivos de OC no se pudieron"} convertir.`;
  const hoja = "El detalle está en la hoja de notas del resumen.";
  if (sinOc.length === 0) {
    return { titulo: `Hay ${fallidos} ${fallidos === 1 ? "archivo" : "archivos"} de OC sin imprimir.`, detalle: hoja };
  }

  const nombradas = sinOc.slice(0, MAX_OV_NOMBRADAS).join(", ");
  const resto = sinOc.length - MAX_OV_NOMBRADAS;
  return {
    titulo: `${sinOc.length} de ${resumen.filas.length} OV ${sinOc.length === 1 ? "no tiene" : "no tienen"} OC para imprimir.`,
    detalle: `${nombradas}${resto > 0 ? ` y ${resto} más` : ""}. ${fallidos > 0 ? `${archivos} ` : ""}Sus órdenes de tarea sí salen. ${hoja}`,
  };
}
