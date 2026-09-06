"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDisableButton,
  PolariaTableEditButton,
  PolariaTableEnableButton,
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
  activateCamionAdmin,
  deactivateCamionAdmin,
  formatCamionId,
  listCamionesAdmin,
  type CamionListRow,
} from "../services/camiones.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { CamionCreateModal } from "./CamionCreateModal";
import { CamionEditModal } from "./CamionEditModal";

type PendingToggle = { row: CamionListRow; mode: "disable" | "enable" };

export function CamionesListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCamion, setEditingCamion] = useState<CamionListRow | null>(
    null,
  );
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchCamiones = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listCamionesAdmin({ codigoCuenta, soloActivos: false });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchCamiones,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateCamionAdmin({
          codigoCuenta,
          idCamion: pendingToggle.row.idCamion,
        });
      } else {
        await activateCamionAdmin({
          codigoCuenta,
          idCamion: pendingToggle.row.idCamion,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el camión."
          : "No se pudo habilitar el camión.",
      );
    } finally {
      setIsToggling(false);
    }
  }, [codigoCuenta, isToggling, pendingToggle, reload]);

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
            !row.estaActivo ? (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ) : row.disponible ? (
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
        {
          id: "acciones",
          header: "Acciones",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          cell: (row: CamionListRow) => (
            <PolariaTableActionGroup>
              <PolariaTableEditButton
                disabled={!row.estaActivo}
                onClick={() => setEditingCamion(row)}
              />
              {row.estaActivo ? (
                <PolariaTableDisableButton
                  onClick={() => {
                    setToggleError(null);
                    setPendingToggle({ row, mode: "disable" });
                  }}
                />
              ) : (
                <PolariaTableEnableButton
                  onClick={() => {
                    setToggleError(null);
                    setPendingToggle({ row, mode: "enable" });
                  }}
                />
              )}
            </PolariaTableActionGroup>
          ),
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

      <CamionEditModal
        open={Boolean(editingCamion)}
        camion={editingCamion}
        onClose={() => setEditingCamion(null)}
        onUpdated={() => {
          void reload();
        }}
      />

      <PolariaConfirmDialog
        open={Boolean(pendingToggle)}
        onClose={() => {
          if (isToggling) return;
          setPendingToggle(null);
          setToggleError(null);
        }}
        onConfirm={() => {
          void handleConfirmToggle();
        }}
        title={
          pendingToggle?.mode === "enable"
            ? "Habilitar camión"
            : "Deshabilitar camión"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar el camión "${pendingToggle.row.placa}"? Volverá a aparecer en formularios.`
              : `¿Deshabilitar el camión "${pendingToggle.row.placa}"? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
            : ""
        }
        confirmLabel={
          pendingToggle?.mode === "enable" ? "Habilitar" : "Deshabilitar"
        }
        isSubmitting={isToggling}
        error={toggleError}
      />
    </AdminCatalogListShell>
  );
}
