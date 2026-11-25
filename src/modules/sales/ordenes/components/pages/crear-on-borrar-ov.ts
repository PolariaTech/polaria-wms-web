import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useAuthStore } from "@/stores/auth.store";
import { borrarOrdenVenta } from "../../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { OvAccionesCtx } from "./ov-impresion-ctx";
import { registrarLogCancelacionOv } from "./registrar-log-cancelacion-ov";
import type { OvPaneles } from "../../hooks/use-ov-paneles";

/**
 * Acción «Borrar» del Cypher (REQ-255: la OV queda en el listado como Cancelada).
 * `undefined` cuando no aplica (inspección, sin Cypher o sin cuenta).
 */
export function crearOnBorrarOv({
  codigoCuenta,
  inspect,
  runScoped,
  rows,
  paneles,
  setBusyAction,
  reload,
}: {
  codigoCuenta: string | null;
  inspect: boolean;
  runScoped: OvAccionesCtx["runScoped"];
  rows: readonly OrdenVentaOperadorRow[];
  paneles: OvPaneles;
  setBusyAction: OvAccionesCtx["setBusyAction"];
  reload: () => Promise<unknown>;
}): (() => Promise<void>) | undefined {
  const {
    cypherId,
    setCypherId,
    setCompanionOtPicker,
    editingId,
    setEditingId,
    setIsCreateOpen,
    detalleId,
    setDetalleId,
    editLock,
  } = paneles;
  if (inspect || !cypherId || !codigoCuenta) return undefined;

  return async () => {
    const target = rows.find((r) => r.idOrdenVenta === cypherId);
    if (!target) {
      throw new DomainServiceError("No se encontró la orden de venta.", "NOT_FOUND");
    }
    setBusyAction({ id: cypherId, kind: "borrar" });
    try {
      await runScoped(() => borrarOrdenVenta({ codigoCuenta, idOrdenVenta: cypherId }));
      const session = useAuthStore.getState().session;
      registrarLogCancelacionOv({
        idOrdenVenta: cypherId,
        codigoCuenta,
        autor: session?.nombre?.trim() || "usuario",
        idUsuario: session?.idUsuario ?? null,
        autorNombre: session?.nombre ?? null,
        idBodega: target.idBodega ?? null,
      });
      // REQ-255: permanece en listado como Cancelada; cerrar paneles de esa OV.
      const borradaId = cypherId;
      setCypherId(null);
      setCompanionOtPicker(null);
      if (editingId === borradaId) {
        setEditingId(null);
        setIsCreateOpen(false);
        editLock.resetLockUi();
      }
      if (detalleId === borradaId) {
        setDetalleId(null);
      }
      void reload();
    } finally {
      setBusyAction(null);
    }
  };
}
