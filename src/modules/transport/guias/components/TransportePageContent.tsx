"use client";

import { useCallback, useMemo, useState } from "react";
import { ModuleListPage } from "@/components/shared/module/ModuleListPage";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { formatEstadoViaje } from "../../shared/constants/viaje-status";
import { listViajesEntrega } from "../../shared/services/transport.service";
import type { ViajeEntregaRow } from "../../shared/types/transport.types";
import { TransporteEntregaModal } from "./TransporteEntregaModal";

function renderEstadoBadge(estado: ViajeEntregaRow["estado"]) {
  const variant =
    estado === "en_ruta"
      ? "warning"
      : estado === "programado"
        ? "neutral"
        : estado === "entregado"
          ? "positive"
          : "neutral";

  return (
    <PolariaTableBadge variant={variant}>
      {formatEstadoViaje(estado)}
    </PolariaTableBadge>
  );
}

export function TransportePageContent({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const { activeBodegaId } = useCompany();
  const { showToast } = usePolariaToast();
  const [selectedViaje, setSelectedViaje] = useState<ViajeEntregaRow | null>(
    null,
  );

  const fetchViajes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listViajesEntrega({
        codigoCuenta,
        idBodega: inspect ? null : activeBodegaId,
      }),
    );
  }, [activeBodegaId, codigoCuenta, inspect, runScoped]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchViajes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      {
        id: "viaje",
        header: "Viaje",
        cell: (row: ViajeEntregaRow) => (
          <PolariaTableCode>{row.codigoViaje}</PolariaTableCode>
        ),
      },
      {
        id: "venta",
        header: "Venta",
        cell: (row: ViajeEntregaRow) => row.codigoVenta,
        cellClassName: "font-mono text-xs text-polaria-w-50",
      },
      {
        id: "cliente",
        header: "Cliente",
        cell: (row: ViajeEntregaRow) => row.clienteNombre,
      },
      {
        id: "kg",
        header: "Kg (venta)",
        cell: (row: ViajeEntregaRow) => `${formatKgEs(row.kgVenta)} kg`,
        cellClassName: "whitespace-nowrap text-right font-mono text-xs",
        headerClassName: "text-right",
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row: ViajeEntregaRow) => renderEstadoBadge(row.estado),
      },
      ...(inspect
        ? []
        : [
            {
              id: "accion",
              header: "Acción",
              cell: (row: ViajeEntregaRow) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!row.idGuia || !row.idOrdenVenta) {
                      showToast({
                        title: "Viaje incompleto",
                        content:
                          "Este viaje no tiene guía u orden de venta asociada.",
                        variant: "error" as const,
                        durationMs: 3500,
                      });
                      return;
                    }
                    setSelectedViaje(row);
                  }}
                  className="rounded-xl bg-polaria-teal px-3 py-2 text-xs font-semibold text-polaria-bg transition hover:opacity-90"
                >
                  Realizar entrega
                </button>
              ),
            },
          ]),
    ],
    [inspect, showToast],
  );

  const body = (
    <div className="flex flex-col gap-3">
      <ModuleListPage
        sectionTitle="Viajes de entrega"
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        emptyMessage="No hay viajes en curso."
        getRowKey={(row) =>
          `${row.idViaje}-${row.idGuia ?? "sin-guia"}-${row.idOrdenVenta ?? "sin-venta"}`
        }
        columns={columns}
      />

      {inspect ? null : (
        <TransporteEntregaModal
          open={Boolean(selectedViaje)}
          viaje={selectedViaje}
          codigoCuenta={codigoCuenta}
          idBodega={activeBodegaId}
          onClose={() => setSelectedViaje(null)}
          onEntregado={() => {
            showToast({
              title: "Entrega registrada",
              content: "El viaje quedó cerrado y la venta pasó a cerrada.",
              variant: "success",
              durationMs: 4000,
            });
            void reload();
          }}
        />
      )}
    </div>
  );

  if (inspect) {
    return (
      <AdminMaestroViewShell inspect sectionLabel="" title="" hint="">
        {body}
      </AdminMaestroViewShell>
    );
  }

  return body;
}
