"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  CAMIONES_EMPTY_MESSAGE,
  CAMIONES_PAGE_HINT,
  CAMIONES_PAGE_TITLE,
  CAMIONES_TABLE_SUBTITLE,
  CAMIONES_TABLE_TITLE,
  ADMIN_CATALOG_SECTION_LABEL,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import {
  activateCamionAdmin,
  deactivateCamionAdmin,
  listCamionesAdmin,
  type CamionListRow,
} from "../services/camiones.service";
import {
  buildCamionesListColumns,
  type CamionPendingToggle,
} from "./camiones-list-view.columns";
import { CamionCreateModal } from "./CamionCreateModal";
import { CamionEditModal } from "./CamionEditModal";

export function CamionesListView({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCamion, setEditingCamion] = useState<CamionListRow | null>(
    null,
  );
  const [pendingToggle, setPendingToggle] = useState<CamionPendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchCamiones = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listCamionesAdmin({ codigoCuenta, soloActivos: false }),
    );
  }, [codigoCuenta, runScoped]);

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
      buildCamionesListColumns({
        setEditingCamion,
        setToggleError,
        setPendingToggle,
      }),
    [],
  );

  return (
    <AdminMaestroViewShell
      inspect={inspect}
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
        columns={
          inspect
            ? columns.filter((column) => column.id !== "acciones")
            : columns
        }
        getRowKey={(row) => row.idCamion}
        emptyMessage={CAMIONES_EMPTY_MESSAGE}
        tableClassName="min-w-[78rem]"
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={
          inspect
            ? undefined
            : {
                label: "Nuevo camión",
                onClick: () => setIsCreateOpen(true),
              }
        }
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
    </AdminMaestroViewShell>
  );
}
