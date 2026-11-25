"use client";

import type { ReactNode } from "react";
import {
  PolariaDataTable,
  type PolariaDataTableColumn,
} from "@/components/shared/table/PolariaDataTable";
import { OrdenCompraCreateModal } from "../../ordenes/components/OrdenCompraCreateModal";
import { OrdenCompraDetalleModal } from "../../ordenes/components/OrdenCompraDetalleModal";
import { SolicitudCompraCreateModal } from "../../solicitudes/components/SolicitudCompraCreateModal";
import { SolicitudCompraDetalleModal } from "../../solicitudes/components/SolicitudCompraDetalleModal";
import { SolicitudProveedorPickerModal } from "../../solicitudes/components/SolicitudProveedorPickerModal";
import {
  ORDENES_TABLE_MIN_WIDTH_CLASS,
  SOLICITUDES_TABLE_MIN_WIDTH_CLASS,
} from "../../shared/constants/compras-table-layout";
import type { OrdenCompraRow, SolicitudCompraRow } from "../../shared/types/purchases.types";
import type { ProveedorListRow } from "@/modules/admin-panel";
import type { OrdenCompraDestinoPatch } from "../../ordenes/components/OrdenCompraDetalleModal";
import { TabButton } from "./compras-page-content.ui";
import type { ComprasPageTableCtx } from "./compras-page-content.table-types";
import type { ComprasTab } from "./compras-page-content.view-types";

export type ComprasPageContentBodyProps = {
  activeTab: ComprasTab;
  setActiveTab: (tab: ComprasTab) => void;
  actionError: string | null;
  actionSuccess: string | null;
  inspect: boolean;
  solicitudes: ComprasPageTableCtx["solicitudes"];
  ordenes: ComprasPageTableCtx["ordenes"];
  solicitudesOrdenadas: SolicitudCompraRow[];
  solicitudColumns: readonly PolariaDataTableColumn<SolicitudCompraRow>[];
  ordenColumns: readonly PolariaDataTableColumn<OrdenCompraRow>[];
  tenantError: string | null;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  isOrdenCreateOpen: boolean;
  setIsOrdenCreateOpen: (open: boolean) => void;
  solicitudDetalle: SolicitudCompraRow | null;
  setSolicitudDetalle: (row: SolicitudCompraRow | null) => void;
  ordenDetalle: OrdenCompraRow | null;
  setOrdenDetalle: (row: OrdenCompraRow | null) => void;
  renderSolicitudActions: (row: SolicitudCompraRow) => ReactNode;
  renderOrdenActions: (row: OrdenCompraRow) => ReactNode;
  codigoCuenta: string | null;
  notifiedOrdenIds: Set<string>;
  handleDestinoChange: ((patch: OrdenCompraDestinoPatch) => Promise<void>) | undefined;
  isSavingDestino: boolean;
  destinoError: string | null;
  pickingSolicitud: SolicitudCompraRow | null;
  setPickingSolicitud: (row: SolicitudCompraRow | null) => void;
  proveedoresPicker: ProveedorListRow[];
  handleProveedorPicked: (proveedor: ProveedorListRow) => void;
  setDestinoError: (error: string | null) => void;
};

export function ComprasPageContentBody(props: ComprasPageContentBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={props.activeTab === "solicitudes"}
          onClick={() => props.setActiveTab("solicitudes")}
        >
          Solicitudes
        </TabButton>
        <TabButton
          active={props.activeTab === "ordenes"}
          onClick={() => props.setActiveTab("ordenes")}
        >
          Órdenes
        </TabButton>
      </div>

      {props.actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-polaria-w-50"
        >
          {props.actionError}
        </p>
      ) : null}

      {props.actionSuccess ? (
        <p
          role="status"
          className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50"
        >
          {props.actionSuccess}
        </p>
      ) : null}

      {props.activeTab === "solicitudes" ? (
        <PolariaDataTable
          title="Solicitudes de compra"
          subtitle="Solicitud · productos · peso kg"
          isLoading={props.solicitudes.isLoading}
          error={props.solicitudes.error ?? props.tenantError}
          rows={props.solicitudesOrdenadas}
          columns={props.solicitudColumns}
          getRowKey={(row) => row.id_solicitud_compra}
          emptyMessage={
            props.inspect
              ? "No hay solicitudes de compra."
              : "No hay solicitudes. Usá «Nueva solicitud» para crear la primera."
          }
          onRefresh={() => {
            void props.solicitudes.reload();
          }}
          isRefreshing={props.solicitudes.isRefreshing}
          onRowClick={(row) => props.setSolicitudDetalle(row)}
          getRowAriaLabel={(row) => `Ver detalle de solicitud ${row.codigo}`}
          tableClassName={SOLICITUDES_TABLE_MIN_WIDTH_CLASS}
          primaryAction={
            props.inspect
              ? undefined
              : {
                  label: "Nueva solicitud",
                  onClick: () => props.setIsCreateOpen(true),
                }
          }
        />
      ) : (
        <PolariaDataTable
          title="Órdenes de compra"
          subtitle="Orden · proveedor · productos · estado · fecha"
          isLoading={props.ordenes.isLoading}
          error={props.ordenes.error ?? props.tenantError}
          rows={props.ordenes.data ?? []}
          columns={props.ordenColumns}
          getRowKey={(row) => row.id_orden_compra}
          emptyMessage={
            props.inspect
              ? "Sin órdenes de compra."
              : "Sin órdenes de compra. Usá «Nueva orden» para crear la primera."
          }
          onRefresh={() => {
            void props.ordenes.reload();
          }}
          isRefreshing={props.ordenes.isRefreshing}
          onRowClick={(row) => props.setOrdenDetalle(row)}
          getRowAriaLabel={(row) => `Ver detalle de orden ${row.codigo}`}
          tableClassName={ORDENES_TABLE_MIN_WIDTH_CLASS}
          primaryAction={
            props.inspect
              ? undefined
              : {
                  label: "Nueva orden",
                  onClick: () => props.setIsOrdenCreateOpen(true),
                }
          }
        />
      )}

      <SolicitudCompraCreateModal
        open={!props.inspect && props.isCreateOpen}
        onClose={() => props.setIsCreateOpen(false)}
        onCreated={() => {
          void props.solicitudes.reload();
        }}
      />

      <OrdenCompraCreateModal
        open={!props.inspect && props.isOrdenCreateOpen}
        onClose={() => props.setIsOrdenCreateOpen(false)}
        onCreated={() => {
          void props.ordenes.reload();
        }}
      />

      {props.solicitudDetalle ? (
        <SolicitudCompraDetalleModal
          solicitud={props.solicitudDetalle}
          onClose={() => props.setSolicitudDetalle(null)}
          actions={props.inspect ? null : props.renderSolicitudActions(props.solicitudDetalle)}
          closeOnEscape={!props.pickingSolicitud}
        />
      ) : null}

      {props.ordenDetalle ? (
        <OrdenCompraDetalleModal
          orden={props.ordenDetalle}
          codigoCuenta={props.codigoCuenta}
          onClose={() => {
            props.setOrdenDetalle(null);
            props.setDestinoError(null);
          }}
          actions={props.inspect ? null : props.renderOrdenActions(props.ordenDetalle)}
          notified={props.notifiedOrdenIds.has(props.ordenDetalle.id_orden_compra)}
          onDestinoChange={
            props.inspect || props.ordenDetalle.estado !== "borrador"
              ? undefined
              : props.handleDestinoChange
          }
          isSavingDestino={props.isSavingDestino}
          destinoError={props.destinoError}
        />
      ) : null}

      <SolicitudProveedorPickerModal
        open={!props.inspect && Boolean(props.pickingSolicitud)}
        onClose={() => props.setPickingSolicitud(null)}
        proveedores={props.proveedoresPicker}
        selectedId={props.pickingSolicitud?.id_proveedor}
        onSelect={props.handleProveedorPicked}
      />
    </div>
  );
}
