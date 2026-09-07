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
  CLIENTES_EMPTY_MESSAGE,
  CLIENTES_PAGE_HINT,
  CLIENTES_PAGE_TITLE,
  CLIENTES_TABLE_SUBTITLE,
  CLIENTES_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  activateClienteAdmin,
  deactivateClienteAdmin,
  formatClienteId,
  listClientesAdmin,
  type ClienteListRow,
} from "../services/clientes.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { ClienteCreateModal } from "./ClienteCreateModal";
import { ClienteEditModal } from "./ClienteEditModal";

type PendingToggle = { row: ClienteListRow; mode: "disable" | "enable" };

export function ClientesListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteListRow | null>(
    null,
  );
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchClientes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listClientesAdmin({ codigoCuenta, soloActivos: false });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchClientes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateClienteAdmin({
          codigoCuenta,
          idCliente: pendingToggle.row.idCliente,
        });
      } else {
        await activateClienteAdmin({
          codigoCuenta,
          idCliente: pendingToggle.row.idCliente,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el cliente."
          : "No se pudo habilitar el cliente.",
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
          cell: (row: ClienteListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatClienteId(row.idCliente)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: ClienteListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: ClienteListRow) => row.nombre,
        },
        {
          id: "nit",
          header: "NIT",
          cell: (row: ClienteListRow) => row.nit,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: ClienteListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: ClienteListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: ClienteListRow) => (
            <PolariaTableActionGroup>
              <PolariaTableEditButton
                disabled={!row.estaActivo}
                onClick={() => setEditingCliente(row)}
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
      title={CLIENTES_PAGE_TITLE}
      hint={CLIENTES_PAGE_HINT}
    >
      <PolariaDataTable
        title={CLIENTES_TABLE_TITLE}
        subtitle={CLIENTES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idCliente}
        emptyMessage={CLIENTES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nuevo cliente",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <ClienteCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <ClienteEditModal
        open={Boolean(editingCliente)}
        cliente={editingCliente}
        onClose={() => setEditingCliente(null)}
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
            ? "Habilitar cliente"
            : "Deshabilitar cliente"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar a "${pendingToggle.row.nombre}"? Volverá a aparecer en formularios.`
              : `¿Deshabilitar a "${pendingToggle.row.nombre}"? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
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
