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
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  PROVEEDORES_EMPTY_MESSAGE,
  PROVEEDORES_PAGE_HINT,
  PROVEEDORES_PAGE_TITLE,
  PROVEEDORES_TABLE_SUBTITLE,
  PROVEEDORES_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  activateProveedorAdmin,
  deactivateProveedorAdmin,
  formatProveedorId,
  listProveedoresAdmin,
  type ProveedorListRow,
} from "../services/proveedores.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { ProveedorCreateModal } from "./ProveedorCreateModal";
import { ProveedorEditModal } from "./ProveedorEditModal";

type PendingToggle = { row: ProveedorListRow; mode: "disable" | "enable" };

export function ProveedoresListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] =
    useState<ProveedorListRow | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchProveedores = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listProveedoresAdmin({ codigoCuenta, soloActivos: false });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchProveedores,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateProveedorAdmin({
          codigoCuenta,
          idProveedor: pendingToggle.row.idProveedor,
        });
      } else {
        await activateProveedorAdmin({
          codigoCuenta,
          idProveedor: pendingToggle.row.idProveedor,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el proveedor."
          : "No se pudo habilitar el proveedor.",
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
          cell: (row: ProveedorListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatProveedorId(row.idProveedor)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: ProveedorListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: ProveedorListRow) => row.proveedor,
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: ProveedorListRow) => row.nombre,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: ProveedorListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "email",
          header: "Email",
          cell: (row: ProveedorListRow) => row.email ?? "—",
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: ProveedorListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: ProveedorListRow) => (
            <PolariaTableActionGroup>
              <PolariaTableEditButton
                disabled={!row.estaActivo}
                onClick={() => setEditingProveedor(row)}
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
      title={PROVEEDORES_PAGE_TITLE}
      hint={PROVEEDORES_PAGE_HINT}
    >
      <PolariaDataTable
        title={PROVEEDORES_TABLE_TITLE}
        subtitle={PROVEEDORES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idProveedor}
        emptyMessage={PROVEEDORES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nuevo proveedor",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <ProveedorCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <ProveedorEditModal
        open={Boolean(editingProveedor)}
        proveedor={editingProveedor}
        onClose={() => setEditingProveedor(null)}
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
            ? "Habilitar proveedor"
            : "Deshabilitar proveedor"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar a "${pendingToggle.row.proveedor}"? Volverá a aparecer en formularios.`
              : `¿Deshabilitar a "${pendingToggle.row.proveedor}"? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
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
