import type { TipoIntegracion } from "../constants/integration-types";

export interface SolicitudIntegracionRow {
  idSolicitudIntegracion: string;
  bodegaExternaId: string;
  bodegaNombre: string;
  tipoIntegracion: TipoIntegracion | null;
  estado: string;
  createdAt: string;
}

export interface CreateSolicitudIntegracionInput {
  codigoCuenta: string;
  idSolicitante: string;
  idCliente?: string;
  bodegaExternaId: string;
  bodegaExternaNombre: string;
  tipoIntegracion: TipoIntegracion;
}
