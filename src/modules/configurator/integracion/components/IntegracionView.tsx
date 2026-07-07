"use client";

import { useCallback } from "react";
import {
  PolariaRequestPageLayout,
  PolariaRequestPanel,
} from "@/components/shared/requests";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { isSolicitudIntegracionPendiente } from "@/modules/account-integration/integracion/constants/integration-types";
import {
  INTEGRACION_EMPTY_HINT,
  INTEGRACION_EMPTY_MESSAGE,
  INTEGRACION_PAGE_HINT,
  INTEGRACION_PAGE_TITLE,
  INTEGRACION_PANEL_TITLE,
} from "../constants/integration";
import { listSolicitudesIntegracionConfigurator } from "../services/integracion.service";
import { IntegracionSolicitudCard } from "./IntegracionSolicitudCard";

export function IntegracionView() {
  const fetchSolicitudes = useCallback(
    () => listSolicitudesIntegracionConfigurator(),
    [],
  );
  const { data, isLoading, error } = useAsyncQuery(fetchSolicitudes);

  const rows = data ?? [];
  const solicitudesCount = rows.length;
  const pendientesCount = rows.filter((row) =>
    isSolicitudIntegracionPendiente(row.estado),
  ).length;

  return (
    <PolariaRequestPageLayout
      title={INTEGRACION_PAGE_TITLE}
      hint={INTEGRACION_PAGE_HINT}
    >
      <PolariaRequestPanel
        title={INTEGRACION_PANEL_TITLE}
        pendingCount={pendientesCount}
        totalCount={solicitudesCount}
        isLoading={isLoading}
        error={error}
        emptyMessage={INTEGRACION_EMPTY_MESSAGE}
        emptyHint={INTEGRACION_EMPTY_HINT}
      >
        {rows.length > 0
          ? rows.map((row) => (
              <IntegracionSolicitudCard
                key={row.idSolicitudIntegracion}
                row={row}
              />
            ))
          : null}
      </PolariaRequestPanel>
    </PolariaRequestPageLayout>
  );
}
