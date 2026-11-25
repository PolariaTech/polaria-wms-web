import type { PropuestaReagrupacionApi } from "./reagrupar-ordenes-trabajo";
import {
  ESTADO_INICIAL_REAGRUPACION,
  reducirModalReagrupacion,
  type AccionModalReagrupacion,
  type EstadoModalReagrupacion,
} from "./reagrupacion-modal-estado";

export const propuesta: PropuestaReagrupacionApi = {
  propuestaId: "prop-1",
  baseHash: "hash",
  ots: [],
  resumen: { antes: 5, despues: 3, nuevas: 0, vacias: 2 },
  movimientos: [],
};

export function correr(...acciones: AccionModalReagrupacion[]): EstadoModalReagrupacion {
  return acciones.reduce(reducirModalReagrupacion, ESTADO_INICIAL_REAGRUPACION);
}

export const escribir = (texto: string): AccionModalReagrupacion => ({ tipo: "ESCRIBIR", texto });
export const generar = (requestId: string): AccionModalReagrupacion => ({
  tipo: "GENERAR",
  requestId,
  firmaBase: "firma-1",
});
