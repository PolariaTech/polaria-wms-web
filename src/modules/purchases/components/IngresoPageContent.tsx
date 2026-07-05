"use client";

import { useCallback, useMemo, useState } from "react";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/PolariaTableCells";
import { formatDateTime } from "@/components/shared/formatters";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/providers/CompanyProvider";
import { canCerrarRecepcionCompra } from "../constants/recepcion-compra.constants";
import { ESTADO_ORDEN_LABELS } from "../constants/purchases-labels";
import {
  listOrdenesCompra,
  listRecepciones,
} from "../services/purchases.service";
import type { OrdenCompraRow, RecepcionCompraRow } from "../types/purchases.types";
import { RecepcionCompraModal } from "./RecepcionCompraModal";

const ESTADOS_PENDIENTES_RECEPCION = new Set<OrdenCompraRow["estado"]>([
  "emitida",
  "parcialmente_recibida",
]);

export function IngresoPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const { idRol } = usePermissions();
  const [ordenRecepcion, setOrdenRecepcion] = useState<OrdenCompraRow | null>(
    null,
  );

  const puedeRegistrar = canCerrarRecepcionCompra(idRol);

  const fetchRecepciones = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([] as RecepcionCompraRow[]);
    }

    return listRecepciones({
      codigoCuenta,
      idBodega: activeBodegaId,
    });
  }, [activeBodegaId, codigoCuenta]);

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([] as OrdenCompraRow[]);
    }

    return listOrdenesCompra({
      codigoCuenta,
      idBodega: activeBodegaId,
    });
  }, [activeBodegaId, codigoCuenta]);

  const recepciones = useAsyncQuery(fetchRecepciones, Boolean(codigoCuenta));
  const ordenes = useAsyncQuery(fetchOrdenes, Boolean(codigoCuenta));

  const ordenesPendientes = useMemo(() => {
    const recepcionadas = new Set(
      (recepciones.data ?? []).map((row) => row.id_orden_compra),
    );

    return (ordenes.data ?? []).filter(
      (orden) =>
        ESTADOS_PENDIENTES_RECEPCION.has(orden.estado) &&
        !recepcionadas.has(orden.id_orden_compra),
    );
  }, [ordenes.data, recepciones.data]);

  const reloadAll = useCallback(async () => {
    await Promise.all([recepciones.reload(), ordenes.reload()]);
  }, [ordenes, recepciones]);

  const isLoading =
    recepciones.isLoading ||
    ordenes.isLoading ||
    recepciones.isRefreshing ||
    ordenes.isRefreshing;

  const error = recepciones.error ?? ordenes.error;

  return (
    <div className="flex flex-col gap-8">
      <ModuleListPage
        sectionTitle="Órdenes pendientes de recepción"
        isLoading={isLoading}
        error={error}
        rows={ordenesPendientes}
        emptyMessage="No hay órdenes emitidas pendientes de recepción."
        getRowKey={(row) => row.id_orden_compra}
        columns={[
          {
            id: "codigo",
            header: "Orden",
            cell: (row) => <PolariaTableCode>{row.codigo}</PolariaTableCode>,
          },
          {
            id: "proveedor",
            header: "Proveedor",
            cell: (row) => row.proveedor_nombre?.trim() || "—",
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => (
              <PolariaTableBadge variant="neutral">
                {ESTADO_ORDEN_LABELS[row.estado] ?? row.estado}
              </PolariaTableBadge>
            ),
          },
          {
            id: "accion",
            header: "Acción",
            cell: (row) =>
              puedeRegistrar ? (
                <button
                  type="button"
                  onClick={() => setOrdenRecepcion(row)}
                  className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-1.5 polaria-text-body-sm font-medium text-polaria-teal hover:bg-polaria-t-20 transition-colors"
                >
                  Registrar recepción
                </button>
              ) : (
                <span className="polaria-text-body-sm text-polaria-w-50">—</span>
              ),
          },
        ]}
      />

      <ModuleListPage
        sectionTitle="Recepciones de compra"
        isLoading={isLoading}
        error={null}
        rows={recepciones.data ?? []}
        emptyMessage="Sin recepciones registradas."
        getRowKey={(row) => row.id_recepcion}
        columns={[
          {
            id: "orden",
            header: "Orden compra",
            cell: (row) => row.id_orden_compra,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "diferencias",
            header: "Sin diferencias",
            cell: (row) => (row.sin_diferencias ? "Sí" : "No"),
          },
          {
            id: "cerrada",
            header: "Cerrada",
            cell: (row) => formatDateTime(row.cerrada_at),
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "created",
            header: "Registro",
            cell: (row) => formatDateTime(row.created_at),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />

      {ordenRecepcion ? (
        <RecepcionCompraModal
          orden={ordenRecepcion}
          onClose={() => setOrdenRecepcion(null)}
          onRegistered={reloadAll}
        />
      ) : null}
    </div>
  );
}
