import type { OcDeOv } from "./oc-documentos";

/** Fragmento de la nota de un documento que ya salió en otra OV; `aviso-oc` lo reconoce para no contarlo como falla. */
export const NOTA_OC_EN_OTRA_OV = "ya va impresa con";

/**
 * REQ-313: las OV hermanas (mismo correo) guardan los mismos adjuntos. En el orden de impresión, un
 * documento (mismo `url`) sale con la primera OV que lo trae; en las siguientes se quita y queda un
 * aviso que dice con qué OV va impresa.
 */
export function quitarOcRepetidas(
  items: ReadonlyArray<{ idOrdenVenta: string; venta: string; oc: OcDeOv }>,
): { ocPorOv: Map<string, OcDeOv>; avisosPorOv: Map<string, string[]> } {
  const ocPorOv = new Map<string, OcDeOv>();
  const avisosPorOv = new Map<string, string[]>();
  const yaSalio = new Map<string, string>();
  for (const { idOrdenVenta, venta, oc } of items) {
    const documentos: OcDeOv["documentos"] = [];
    const avisos: string[] = [];
    for (const documento of oc.documentos) {
      const ventaAnterior = yaSalio.get(documento.url);
      if (ventaAnterior) {
        avisos.push(`${documento.nombre}: ${NOTA_OC_EN_OTRA_OV} ${ventaAnterior}.`);
        continue;
      }
      yaSalio.set(documento.url, venta);
      documentos.push(documento);
    }
    ocPorOv.set(idOrdenVenta, { documentos, omitidos: oc.omitidos });
    avisosPorOv.set(idOrdenVenta, avisos);
  }
  return { ocPorOv, avisosPorOv };
}
