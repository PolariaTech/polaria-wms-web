import type { OrdenCompraRow, SolicitudCompraRow } from "../../shared/types/purchases.types";
import type { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";

export type ComprasPageTableCtx = {
  puedeAprobarSolicitud: boolean;
  pendingActionId: string | null;
  pickingSolicitud: SolicitudCompraRow | null;
  notifiedOrdenIds: Set<string>;
  startEnviarAprobacion: (row: SolicitudCompraRow) => void;
  runAction: (actionId: string, action: () => Promise<unknown>) => Promise<void>;
  runNotifyProveedor: (orden: OrdenCompraRow) => Promise<void>;
  solicitudes: ReturnType<typeof useAsyncQuery<SolicitudCompraRow[]>>;
  ordenes: ReturnType<typeof useAsyncQuery<OrdenCompraRow[]>>;
};
