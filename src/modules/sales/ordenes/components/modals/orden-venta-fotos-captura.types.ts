export interface OrdenVentaFotoCapturaItem {
  idFoto?: string;
  idOrdenTrabajo?: string;
  urlFoto: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrdenVentaOtConFotosItem {
  idOrdenTrabajo: string;
  totalFotos: number;
  ultimaAt: string;
  previewUrl: string;
  label?: string;
  numeroPedido?: string;
  centroConsumo?: string;
}