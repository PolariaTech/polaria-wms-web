import type { PropuestaCorreccionCorreoApi } from "./aplicar-correccion-correo";

/** Diferencia máxima (en pesos) para dar por iguales dos totales; igual al checksum del api. */
export const TOLERANCIA_TOTAL_FORMULARIO = 0.05;

/**
 * Suma de los «Total pedido» de los documentos leídos. Null si no hay documentos o alguno
 * no declara total: sin la cifra completa no se puede comparar contra el formulario.
 */
export function totalDeclaradoPorDocumentos(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "documentos">,
): number | null {
  if (propuesta.documentos.length === 0) return null;
  let suma = 0;
  for (const documento of propuesta.documentos) {
    const total = documento.verificacion.totalDocumento;
    if (typeof total !== "number" || !Number.isFinite(total)) return null;
    suma += total;
  }
  return suma;
}

/**
 * REQ-425: la propuesta se compara contra `origen_correo`, no contra las líneas que el
 * formulario tiene ahora. Si las líneas se desviaron del correo (producto o precio cambiado
 * al materializar) la diferencia estructural es cero aunque el total de la OV no cuadre.
 * Devuelve el total del documento si el formulario difiere de él; null si cuadra o no se sabe.
 */
export function totalDocumentoQueFormularioNoCuadra(
  propuesta: Pick<PropuestaCorreccionCorreoApi, "documentos">,
  importeFormulario: number | null | undefined,
): number | null {
  if (typeof importeFormulario !== "number" || !Number.isFinite(importeFormulario)) {
    return null;
  }
  const totalDocumentos = totalDeclaradoPorDocumentos(propuesta);
  if (totalDocumentos === null) return null;
  return Math.abs(importeFormulario - totalDocumentos) > TOLERANCIA_TOTAL_FORMULARIO
    ? totalDocumentos
    : null;
}
