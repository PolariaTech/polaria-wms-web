"use client";

import { PERMISSION } from "@/constants/permissions";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { formatDateTime } from "@/components/shared/formatters";
import { useWarehouseStateRealtime } from "@/hooks/useWarehouseStateRealtime";
import { useCompany } from "@/providers/CompanyProvider";

function MapaModuleContent() {
  const { activeBodegaId } = useCompany();
  const { rows, isConnected, isLoading, error, lastEventAt } =
    useWarehouseStateRealtime();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Bodega activa:{" "}
          <span className="text-polaria-w">{activeBodegaId ?? "—"}</span>
        </p>
        {isConnected ? (
          <span
            className="polaria-text-badge inline-flex items-center gap-2 rounded-full border border-polaria-t-20 bg-polaria-t-08 px-3 py-1.5 text-polaria-teal"
            aria-live="polite"
          >
            <span
              aria-hidden
              className="h-2 w-2 animate-pulse rounded-full bg-polaria-teal polaria-teal-glow"
            />
            En vivo
          </span>
        ) : null}
      </div>

      {lastEventAt ? (
        <p className="polaria-text-body-sm text-polaria-w-20">
          Último evento:{" "}
          {lastEventAt.toLocaleString("es-CL", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </p>
      ) : null}

      <ModuleListPage
        isLoading={isLoading}
        error={error}
        rows={rows}
        emptyMessage="Sin posiciones de inventario en esta bodega."
        getRowKey={(row) => row.id_warehouse_state}
        columns={[
          {
            id: "ubicacion",
            header: "Ubicación",
            cell: (row) => row.id_ubicacion,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "producto",
            header: "Producto",
            cell: (row) => row.id_producto,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "lote",
            header: "Lote",
            cell: (row) => row.id_lote ?? "—",
            cellClassName: "font-mono text-xs text-polaria-w-50",
          },
          { id: "cantidad", header: "Cantidad", cell: (row) => row.cantidad },
          {
            id: "reservada",
            header: "Reservada",
            cell: (row) => row.cantidad_reservada,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "temperatura",
            header: "Temp.",
            cell: (row) => row.temperatura ?? "—",
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "updated",
            header: "Actualizado",
            cell: (row) => formatDateTime(row.updated_at),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />
    </div>
  );
}

export default function DashboardMapaPage() {
  return (
    <OperationalModuleShell
      title="Mapa de inventario"
      description="Estado en tiempo real por ubicación en la bodega activa."
      gate={{ permission: PERMISSION.INVENTORY_READ }}
      accessDeniedMessage="No tienes permiso para consultar el inventario de esta bodega."
    >
      <MapaModuleContent />
    </OperationalModuleShell>
  );
}
