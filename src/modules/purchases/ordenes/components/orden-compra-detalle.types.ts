import type { DestinoTipoOrden } from "../../shared/types/purchases.types";

export interface OrdenCompraDestinoPatch {
  destinoTipo?: DestinoTipoOrden;
  idBodega?: string;
  fechaEntregaEstimada?: string | null;
}

export const DESTINO_TIPO_OPTIONS = [
  { value: "interna", label: "Bodega interna" },
  { value: "externa", label: "Bodega externa" },
] as const;
