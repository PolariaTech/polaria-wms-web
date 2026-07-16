"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  formatCamionCreatedAt,
  formatCamionDecimal,
  formatCamionMarcaModelo,
  getCamionTipoLabel,
} from "../constants/camion-types";
import {
  CAMIONES_EMPTY_MESSAGE,
  CAMIONES_PAGE_HINT,
  CAMIONES_PAGE_TITLE,
  CAMIONES_TABLE_SUBTITLE,
  CAMIONES_TABLE_TITLE,
  ADMIN_CATALOG_SECTION_LABEL,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  formatCamionId,
  listCamionesAdmin,
  type CamionListRow,
} from "../services/camiones.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { CamionCreateModal } from "./CamionCreateModal";

export function CamionesListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCamiones = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listCamionesAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchCamiones,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "id",
          header: "ID",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          cell: (row: CamionListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatCamionId(row.idCamion)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Cód",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          cell: (row: CamionListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "placa",
          header: "Placa",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap font-medium",
          cell: (row: CamionListRow) => row.placa,
        },
        {
          id: "marca-modelo",
          header: "Marca / Modelo",
          headerClassName: "min-w-[14rem] whitespace-nowrap",
          cellClassName: "min-w-[14rem] whitespace-nowrap",
          cell: (row: CamionListRow) =>
            formatCamionMarcaModelo(row.marca, row.modelo),
        },
        {
          id: "tipo",
          header: "Tipo",
          headerClassName: "min-w-[7rem] whitespace-nowrap",
          cellClassName: "min-w-[7rem] whitespace-nowrap",
          cell: (row: CamionListRow) => getCamionTipoLabel(row.tipo),
        },
        {
          id: "peso-max",
          header: "Peso Máx",
          headerClassName: "min-w-[7rem] whitespace-nowrap",
          cellClassName: "min-w-[7rem] whitespace-nowrap",
          cell: (row: CamionListRow) =>
            formatCamionDecimal(row.capacidadKg, "kg"),
        },
        {
          id: "volumen",
          header: "Volumen",
          headerClassName: "min-w-[6rem] whitespace-nowrap",
          cellClassName: "min-w-[6rem] whitespace-nowrap",
          cell: (row: CamionListRow) =>
            formatCamionDecimal(row.capacidadM3, "m³"),
        },
        {
          id: "pallets",
          header: "Pallets",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          cell: (row: CamionListRow) => row.capacidadPallets ?? "—",
        },
        {
          id: "rango-temp",
          header: "Rango Temp",
          headerClassName: "min-w-[10rem] whitespace-nowrap",
          cellClassName: "min-w-[10rem] whitespace-nowrap",
          cell: (row: CamionListRow) => row.rangoTemperatura ?? "—",
        },
        {
          id: "estado",
          header: "Estado",
          headerClassName: "min-w-[8rem] whitespace-nowrap",
          cellClassName: "min-w-[8rem] whitespace-nowrap",
          cell: (row: CamionListRow) =>
            row.disponible ? (
              <PolariaTableBadge>Disponible</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">No disponible</PolariaTableBadge>
            ),
        },
        {
          id: "creado",
          header: "Creado",
          headerClassName: "min-w-[7rem] whitespace-nowrap",
          cellClassName: "min-w-[7rem] whitespace-nowrap",
          cell: (row: CamionListRow) => formatCamionCreatedAt(row.createdAt),
        },
      ] as const,
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={CAMIONES_PAGE_TITLE}
      hint={CAMIONES_PAGE_HINT}
    >
      <PolariaDataTable
        title={CAMIONES_TABLE_TITLE}
        subtitle={CAMIONES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idCamion}
        emptyMessage={CAMIONES_EMPTY_MESSAGE}
        tableClassName="min-w-[78rem]"
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nuevo camión",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <CamionCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
