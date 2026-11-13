import { nombreTraeOc } from "../utils/origen/oc-en-nombre-de-archivo";
import type { OcDeOv } from "./oc-documentos";

/**
 * REQ-313: de los documentos de una OV, solo el que trae su OC en el nombre cuando lo hay. Las OV de
 * un correo partido guardan todos los adjuntos del correo; los de otra OC son de una OV hermana. No
 * se anotan como omitidos: `prepararOcDeOv` los mostraría como «pesa más de 10 MB». Si ningún nombre
 * trae la OC (o la OV no tiene OC), no se filtra nada.
 */
export function ocPropiaDeOv(oc: OcDeOv, occ: string | null | undefined): OcDeOv {
  const propios = oc.documentos.filter((documento) => nombreTraeOc(documento.nombre, occ));
  if (propios.length === 0) return oc;
  return { documentos: propios, omitidos: oc.omitidos };
}
