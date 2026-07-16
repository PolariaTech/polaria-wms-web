"use client";

import { useCallback, useState } from "react";
import { ModuleListPage } from "@/components/shared/module/ModuleListPage";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import { useTenantList } from "@/hooks/shared/useTenantList";
import { formatKgEs } from "@/lib/utils/decimal-es";
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

export function TransportePageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const { showToast } = usePolariaToast();
  const [selectedViaje, setSelectedViaje] = useState<ViajeEntregaRow | null>(
    null,
  );
  const [reloadToken, setReloadToken] = useState(0);

  const loadViajes = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listViajesEntrega({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const viajes = useTenantList(loadViajes, true, reloadToken);

  const handleEntregado = () => {
    showToast({
      title: "Entrega registrada",
      content: "El viaje quedó cerrado y la venta pasó a cerrada.",
      variant: "success",
      durationMs: 4000,
    });
    setReloadToken((value) => value + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <ModuleListPage
        sectionTitle="Viajes de entrega"
        isLoading={viajes.isLoading}
        error={viajes.error}
        rows={viajes.rows}
        emptyMessage="No hay viajes en curso."
        getRowKey={(row) =>
          `${row.idViaje}-${row.idGuia ?? "sin-guia"}-${row.idOrdenVenta ?? "sin-venta"}`
        }
        columns={[
          {
            id: "viaje",
            header: "Viaje",
            cell: (row) => (
              <PolariaTableCode>{row.codigoViaje}</PolariaTableCode>
            ),
          },
          {
            id: "venta",
            header: "Venta",
            cell: (row) => row.codigoVenta,
            cellClassName: "font-mono text-xs text-polaria-w-50",
          },
          {
            id: "cliente",
            header: "Cliente",
            cell: (row) => row.clienteNombre,
          },
          {
            id: "kg",
            header: "Kg (venta)",
            cell: (row) => `${formatKgEs(row.kgVenta)} kg`,
            cellClassName: "whitespace-nowrap text-right font-mono text-xs",
            headerClassName: "text-right",
          },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => renderEstadoBadge(row.estado),
          },
          {
            id: "accion",
            header: "Acción",
            cell: (row) => (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!row.idGuia || !row.idOrdenVenta) {
                    showToast({
                      title: "Viaje incompleto",
                      content:
                        "Este viaje no tiene guía u orden de venta asociada.",
                      variant: "error",
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
        ]}
      />

      <TransporteEntregaModal
        open={Boolean(selectedViaje)}
        viaje={selectedViaje}
        codigoCuenta={codigoCuenta}
        idBodega={activeBodegaId}
        onClose={() => setSelectedViaje(null)}
        onEntregado={handleEntregado}
      />
    </div>
  );
}
