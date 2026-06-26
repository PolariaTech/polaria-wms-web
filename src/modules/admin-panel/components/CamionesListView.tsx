"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { useCompany } from "@/providers/CompanyProvider";
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
} from "../constants/admin-catalog-list";
import {
  formatCamionId,
  listCamionesAdmin,
  type CamionListRow,
} from "../services/camiones.service";
import { AdminCatalogListShell } from "./AdminCatalogListShell";
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
          cell: (row: CamionListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatCamionId(row.idCamion)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Cód",
          cell: (row: CamionListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "placa",
          header: "Placa",
          cell: (row: CamionListRow) => row.placa,
        },
        {
          id: "marca-modelo",
          header: "Marca / Modelo",
          cell: (row: CamionListRow) =>
            formatCamionMarcaModelo(row.marca, row.modelo),
        },
        {
          id: "tipo",
          header: "Tipo",
          cell: (row: CamionListRow) => getCamionTipoLabel(row.tipo),
        },
        {
          id: "peso-max",
          header: "Peso Máx",
          cell: (row: CamionListRow) =>
            formatCamionDecimal(row.capacidadKg, "kg"),
        },
        {
          id: "volumen",
          header: "Volumen",
          cell: (row: CamionListRow) =>
            formatCamionDecimal(row.capacidadM3, "m³"),
        },
        {
          id: "pallets",
          header: "Pallets",
          cell: (row: CamionListRow) => row.capacidadPallets ?? "—",
        },
        {
          id: "rango-temp",
          header: "Rango Temp",
          cell: (row: CamionListRow) => row.rangoTemperatura ?? "—",
        },
        {
          id: "estado",
          header: "Estado",
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
          cell: (row: CamionListRow) => formatCamionCreatedAt(row.createdAt),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: () => <PolariaTableEditButton />,
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
