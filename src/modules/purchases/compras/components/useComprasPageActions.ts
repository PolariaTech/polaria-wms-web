"use client";

import { useCallback, useState } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listProveedoresAdmin,
  type ProveedorListRow,
} from "@/modules/admin-panel";
import {
  enviarSolicitudCompraAprobacionApi,
  updateOrdenCompraDestinoApi,
} from "../../shared/services/purchases-api.service";
import {
  buildPedidoProveedorRequest,
  notifyProveedorPedido,
} from "../../ordenes/services/pedido-proveedor-client.service";
import { listOrdenCompraLineas } from "../../shared/services/purchases.service";
import type {
  OrdenCompraRow,
  SolicitudCompraRow,
} from "../../shared/types/purchases.types";
import type { OrdenCompraDestinoPatch } from "../../ordenes/components/OrdenCompraDetalleModal";
import {
  parseDestinoTipoOrden,
  toFechaOrdenInputValue,
} from "../../ordenes/utils/orden-compra-display";
import type { ComprasPageTableCtx } from "./compras-page-content.table-types";

export interface UseComprasPageActionsParams {
  codigoCuenta: string | null;
  solicitudes: ComprasPageTableCtx["solicitudes"];
  ordenes: ComprasPageTableCtx["ordenes"];
}

export function useComprasPageActions({
  codigoCuenta,
  solicitudes,
  ordenes,
}: UseComprasPageActionsParams) {
  const [solicitudDetalle, setSolicitudDetalle] =
    useState<SolicitudCompraRow | null>(null);
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCompraRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [notifiedOrdenIds, setNotifiedOrdenIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSavingDestino, setIsSavingDestino] = useState(false);
  const [destinoError, setDestinoError] = useState<string | null>(null);
  const [pickingSolicitud, setPickingSolicitud] =
    useState<SolicitudCompraRow | null>(null);
  const [proveedoresPicker, setProveedoresPicker] = useState<
    ProveedorListRow[]
  >([]);

  const runAction = useCallback(
    async (actionId: string, action: () => Promise<unknown>) => {
      setActionError(null);
      setActionSuccess(null);
      setPendingActionId(actionId);

      try {
        await action();
        await Promise.all([solicitudes.reload(), ordenes.reload()]);
        setSolicitudDetalle(null);
        setOrdenDetalle(null);
      } catch (err: unknown) {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo completar la acción.",
        );
      } finally {
        setPendingActionId(null);
      }
    },
    [ordenes, solicitudes],
  );

  const startEnviarAprobacion = useCallback(
    (row: SolicitudCompraRow) => {
      const existingProveedor = row.id_proveedor?.trim() ?? "";
      if (existingProveedor) {
        void runAction(`${row.id_solicitud_compra}:enviar`, () =>
          enviarSolicitudCompraAprobacionApi(row.id_solicitud_compra),
        );
        return;
      }

      if (!codigoCuenta) {
        setActionError("No se encontró la cuenta activa.");
        return;
      }

      setActionError(null);
      setActionSuccess(null);
      setPendingActionId(`${row.id_solicitud_compra}:enviar`);

      void listProveedoresAdmin({ codigoCuenta })
        .then((rows) => {
          if (rows.length === 0) {
            setActionError(
              "Registra un proveedor en Administración antes de enviar a aprobación.",
            );
            return;
          }

          setProveedoresPicker(rows);
          setPickingSolicitud(row);
        })
        .catch((err: unknown) => {
          setActionError(
            err instanceof DomainServiceError
              ? err.message
              : "No se pudieron cargar los proveedores.",
          );
        })
        .finally(() => {
          setPendingActionId((current) =>
            current === `${row.id_solicitud_compra}:enviar` ? null : current,
          );
        });
    },
    [codigoCuenta, runAction],
  );

  const handleProveedorPicked = useCallback(
    (proveedor: ProveedorListRow) => {
      const row = pickingSolicitud;
      setPickingSolicitud(null);
      if (!row) {
        return;
      }

      void runAction(`${row.id_solicitud_compra}:enviar`, () =>
        enviarSolicitudCompraAprobacionApi(row.id_solicitud_compra, {
          idProveedor: proveedor.idProveedor,
        }),
      );
    },
    [pickingSolicitud, runAction],
  );

  const runNotifyProveedor = useCallback(
    async (orden: OrdenCompraRow) => {
      const actionId = `${orden.id_orden_compra}:notificar`;
      setActionError(null);
      setActionSuccess(null);
      setPendingActionId(actionId);

      try {
        const lineas = await listOrdenCompraLineas(orden.id_orden_compra);
        const result = await notifyProveedorPedido(
          buildPedidoProveedorRequest(orden, lineas),
        );

        setNotifiedOrdenIds((current) => {
          const next = new Set(current);
          next.add(orden.id_orden_compra);
          return next;
        });
        setActionSuccess(
          result.correlationId
            ? `Proveedor notificado (ref. ${result.correlationId.slice(0, 8)}).`
            : "Proveedor notificado correctamente.",
        );
      } catch (err: unknown) {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo notificar al proveedor.",
        );
      } finally {
        setPendingActionId(null);
      }
    },
    [],
  );

  const handleDestinoChange = useCallback(
    async (patch: OrdenCompraDestinoPatch) => {
      if (!ordenDetalle || !codigoCuenta) {
        return;
      }

      const nextTipo =
        patch.destinoTipo !== undefined
          ? patch.destinoTipo
          : parseDestinoTipoOrden(ordenDetalle.destino_tipo);
      const nextBodegaId =
        patch.idBodega !== undefined
          ? patch.idBodega
          : (ordenDetalle.id_bodega?.trim() ?? "");
      const nextFechaInput =
        patch.fechaEntregaEstimada !== undefined
          ? patch.fechaEntregaEstimada === null
            ? ""
            : patch.fechaEntregaEstimada
          : toFechaOrdenInputValue(ordenDetalle.fecha_entrega_estimada);

      setDestinoError(null);
      setOrdenDetalle((current) =>
        current
          ? {
              ...current,
              ...(patch.destinoTipo !== undefined
                ? { destino_tipo: patch.destinoTipo }
                : {}),
              ...(patch.idBodega !== undefined
                ? { id_bodega: patch.idBodega }
                : {}),
              ...(patch.fechaEntregaEstimada !== undefined
                ? {
                    fecha_entrega_estimada:
                      patch.fechaEntregaEstimada === null ||
                      patch.fechaEntregaEstimada === ""
                        ? null
                        : patch.fechaEntregaEstimada.includes("T")
                          ? patch.fechaEntregaEstimada
                          : `${patch.fechaEntregaEstimada}T12:00:00.000Z`,
                  }
                : {}),
            }
          : current,
      );

      if (!nextBodegaId.trim()) {
        return;
      }

      setIsSavingDestino(true);

      try {
        const updated = await updateOrdenCompraDestinoApi(
          ordenDetalle.id_orden_compra,
          {
            destinoTipo: nextTipo,
            idBodega: nextBodegaId,
            fechaEntregaEstimada: nextFechaInput || null,
          },
        );

        setOrdenDetalle((current) =>
          current
            ? {
                ...current,
                id_bodega: updated.idBodega,
                destino_tipo: nextTipo,
              }
            : current,
        );
        await ordenes.reload();
      } catch (err: unknown) {
        setDestinoError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo actualizar el destino.",
        );
      } finally {
        setIsSavingDestino(false);
      }
    },
    [codigoCuenta, ordenDetalle, ordenes],
  );

  return {
    solicitudDetalle,
    setSolicitudDetalle,
    ordenDetalle,
    setOrdenDetalle,
    actionError,
    actionSuccess,
    pendingActionId,
    notifiedOrdenIds,
    isSavingDestino,
    destinoError,
    setDestinoError,
    pickingSolicitud,
    setPickingSolicitud,
    proveedoresPicker,
    runAction,
    startEnviarAprobacion,
    handleProveedorPicked,
    runNotifyProveedor,
    handleDestinoChange,
  };
}
