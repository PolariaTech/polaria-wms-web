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
  ADMIN_CATALOG_SECTION_LABEL,
  PLANTAS_EMPTY_MESSAGE,
  PLANTAS_PAGE_HINT,
  PLANTAS_PAGE_TITLE,
  PLANTAS_TABLE_SUBTITLE,
  PLANTAS_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  activatePlantaAdmin,
  deactivatePlantaAdmin,
  formatPlantaId,
  listPlantasAdmin,
  type PlantaListRow,
} from "../services/plantas.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { PlantaCreateModal } from "./PlantaCreateModal";
import { PlantaEditModal } from "./PlantaEditModal";

type PendingToggle = { row: PlantaListRow; mode: "disable" | "enable" };

export function PlantasListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlanta, setEditingPlanta] = useState<PlantaListRow | null>(
    null,
  );
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchPlantas = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listPlantasAdmin({ codigoCuenta, soloActivos: false });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchPlantas,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivatePlantaAdmin({
          codigoCuenta,
          idPlanta: pendingToggle.row.idPlanta,
        });
      } else {
        await activatePlantaAdmin({
          codigoCuenta,
          idPlanta: pendingToggle.row.idPlanta,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar la planta."
          : "No se pudo habilitar la planta.",
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
          cell: (row: PlantaListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatPlantaId(row.idPlanta)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: PlantaListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: PlantaListRow) => row.nombre,
        },
        {
          id: "direccion",
          header: "Dirección",
          cell: (row: PlantaListRow) => row.direccion,
        },
        {
          id: "pallets",
          header: "Cap. Pallets",
          cell: (row: PlantaListRow) => row.capacidadPallets ?? "—",
        },
        {
          id: "rango-temp",
          header: "Rango Temp",
          cell: (row: PlantaListRow) => row.rangoTemperatura ?? "—",
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: PlantaListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: PlantaListRow) => (
            <PolariaTableActionGroup>
              <PolariaTableEditButton
                disabled={!row.estaActivo}
                onClick={() => setEditingPlanta(row)}
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
      title={PLANTAS_PAGE_TITLE}
      hint={PLANTAS_PAGE_HINT}
    >
      <PolariaDataTable
        title={PLANTAS_TABLE_TITLE}
        subtitle={PLANTAS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idPlanta}
        emptyMessage={PLANTAS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nueva planta",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <PlantaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <PlantaEditModal
        open={Boolean(editingPlanta)}
        planta={editingPlanta}
        onClose={() => setEditingPlanta(null)}
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
            ? "Habilitar planta"
            : "Deshabilitar planta"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar "${pendingToggle.row.nombre}"? Volverá a aparecer en formularios.`
              : `¿Deshabilitar "${pendingToggle.row.nombre}"? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
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
