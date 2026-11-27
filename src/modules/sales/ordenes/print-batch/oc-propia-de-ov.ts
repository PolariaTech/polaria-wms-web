import { documentosDeOc } from "../utils/origen/oc-en-nombre-de-archivo";
import type { OcDeOv } from "./oc-documentos";

/**
 * REQ-313 / REQ-404: de los documentos de una OV, los que son su OC. Las OV de un correo partido
 * guardan todos los adjuntos del correo; los de otra OC son de una OV hermana. Si el nombre de la OC
 * de esta OV la trae, va ese documento. Si ninguno la trae (nombre mal puesto), van los que no nombran
 * la OC de una OV hermana (`ocsHermanas`). No se anotan como omitidos: `prepararOcDeOv` los mostraría
 * como «pesa más de 10 MB».
 */
export function ocPropiaDeOv(
  oc: OcDeOv,
  occ: string | null | undefined,
  ocsHermanas: readonly (string | null | undefined)[] = [],
): OcDeOv {
  const documentos = documentosDeOc(oc.documentos, occ, ocsHermanas);
  if (documentos.length === oc.documentos.length) return oc;
  return { documentos, omitidos: oc.omitidos };
}
