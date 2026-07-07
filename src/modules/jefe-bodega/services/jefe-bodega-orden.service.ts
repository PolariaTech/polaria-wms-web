import { createOrdenTrabajoApi } from "@/modules/operations";
import type { FlujoOrdenTrabajoApi } from "@/modules/operations";

export interface CreateJefeOrdenInput {
  codigoCuenta: string;
  idBodega: string;
  tipoFlujo: FlujoOrdenTrabajoApi;
  idUbicacionOrigen?: string;
  idUbicacionDestino?: string;
  idAsignado?: string;
  observaciones?: string;
}

export async function createJefeOrdenTrabajo(input: CreateJefeOrdenInput) {
  return createOrdenTrabajoApi(input);
}
