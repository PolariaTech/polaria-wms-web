"use client";

import { useCallback, useMemo, useState } from "react";
import { WmsRol } from "@/constants/wms/roles";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  listOrdenesCompra,
  listSolicitudesCompra,
} from "../../shared/services/purchases.service";
import { compareSolicitudCompraByCodigoDesc } from "../../solicitudes/utils/solicitud-compra-display";
import type { ComprasTab } from "./compras-page-content.view-types";
import { useComprasPageTables } from "./useComprasPageTables";
import { useComprasPageActions } from "./useComprasPageActions";
import { ComprasPageContentBody } from "./ComprasPageContentBody";

export function ComprasPageContentImpl({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const { activeBodegaId } = useCompany();
  const { idRol } = usePermissions();
  const [activeTab, setActiveTab] = useState<ComprasTab>("solicitudes");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOrdenCreateOpen, setIsOrdenCreateOpen] = useState(false);

  const puedeAprobarSolicitud =
    idRol === WmsRol.administrador_cuenta || idRol === WmsRol.configurador;

  const fetchSolicitudes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listSolicitudesCompra({
        codigoCuenta,
        idBodega: inspect ? null : activeBodegaId,
      }),
    );
  }, [activeBodegaId, codigoCuenta, inspect, runScoped]);

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listOrdenesCompra({
        codigoCuenta,
        idBodega: inspect ? null : activeBodegaId,
      }),
    );
  }, [activeBodegaId, codigoCuenta, inspect, runScoped]);

  const solicitudes = useAsyncQuery(fetchSolicitudes, Boolean(codigoCuenta));
  const ordenes = useAsyncQuery(fetchOrdenes, Boolean(codigoCuenta));

  const solicitudesOrdenadas = useMemo(
    () =>
      [...(solicitudes.data ?? [])].sort(compareSolicitudCompraByCodigoDesc),
    [solicitudes.data],
  );

  const {
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
  } = useComprasPageActions({ codigoCuenta, solicitudes, ordenes });

  const {
    solicitudColumns,
    renderSolicitudActions,
    renderOrdenActions,
    ordenColumns,
  } = useComprasPageTables({
    puedeAprobarSolicitud,
    pendingActionId,
    pickingSolicitud,
    notifiedOrdenIds,
    startEnviarAprobacion,
    runAction,
    runNotifyProveedor,
    solicitudes,
    ordenes,
  });

  const tenantError =
    !codigoCuenta ? "No se encontró la cuenta activa." : null;

  const body = (
    <ComprasPageContentBody
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      actionError={actionError}
      actionSuccess={actionSuccess}
      inspect={inspect}
      solicitudes={solicitudes}
      ordenes={ordenes}
      solicitudesOrdenadas={solicitudesOrdenadas}
      solicitudColumns={solicitudColumns}
      ordenColumns={ordenColumns}
      tenantError={tenantError}
      isCreateOpen={isCreateOpen}
      setIsCreateOpen={setIsCreateOpen}
      isOrdenCreateOpen={isOrdenCreateOpen}
      setIsOrdenCreateOpen={setIsOrdenCreateOpen}
      solicitudDetalle={solicitudDetalle}
      setSolicitudDetalle={setSolicitudDetalle}
      ordenDetalle={ordenDetalle}
      setOrdenDetalle={setOrdenDetalle}
      renderSolicitudActions={renderSolicitudActions}
      renderOrdenActions={renderOrdenActions}
      codigoCuenta={codigoCuenta}
      notifiedOrdenIds={notifiedOrdenIds}
      handleDestinoChange={handleDestinoChange}
      isSavingDestino={isSavingDestino}
      destinoError={destinoError}
      pickingSolicitud={pickingSolicitud}
      setPickingSolicitud={setPickingSolicitud}
      proveedoresPicker={proveedoresPicker}
      handleProveedorPicked={handleProveedorPicked}
      setDestinoError={setDestinoError}
    />
  );

  if (inspect) {
    return (
      <AdminMaestroViewShell
        inspect
        sectionLabel=""
        title=""
        hint=""
      >
        {body}
      </AdminMaestroViewShell>
    );
  }

  return body;
}
