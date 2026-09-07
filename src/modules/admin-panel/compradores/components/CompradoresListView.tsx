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
  COMPRADORES_EMPTY_MESSAGE,
  COMPRADORES_PAGE_HINT,
  COMPRADORES_PAGE_TITLE,
  COMPRADORES_TABLE_SUBTITLE,
  COMPRADORES_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  activateCompradorAdmin,
  deactivateCompradorAdmin,
  listCompradoresAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { CompradorCreateModal } from "./CompradorCreateModal";
import { CompradorDetalleModal } from "./CompradorDetalleModal";
import { CompradorEditModal } from "./CompradorEditModal";

type PendingToggle = { row: CompradorListRow; mode: "disable" | "enable" };

export function CompradoresListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingComprador, setEditingComprador] =
    useState<CompradorListRow | null>(null);
  const [detalleComprador, setDetalleComprador] =
    useState<CompradorListRow | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchCompradores = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listCompradoresAdmin({ codigoCuenta, soloActivos: false });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchCompradores,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateCompradorAdmin({
          codigoCuenta,
          idComprador: pendingToggle.row.idComprador,
        });
      } else {
        await activateCompradorAdmin({
          codigoCuenta,
          idComprador: pendingToggle.row.idComprador,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el comprador."
          : "No se pudo habilitar el comprador.",
      );
    } finally {
      setIsToggling(false);
    }
  }, [codigoCuenta, isToggling, pendingToggle, reload]);

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: CompradorListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "comprador",
          header: "Comprador",
          cell: (row: CompradorListRow) => row.comprador,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: CompradorListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: CompradorListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CompradorListRow) => (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableActionGroup>
                <PolariaTableEditButton
                  disabled={!row.estaActivo}
                  onClick={() => setEditingComprador(row)}
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
            </span>
          ),
        },
      ] as const,
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={COMPRADORES_PAGE_TITLE}
      hint={COMPRADORES_PAGE_HINT}
    >
      <PolariaDataTable
        title={COMPRADORES_TABLE_TITLE}
        subtitle={COMPRADORES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idComprador}
        emptyMessage={COMPRADORES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nuevo comprador",
          onClick: () => setIsCreateOpen(true),
        }}
        onRowClick={(row) => setDetalleComprador(row)}
        getRowAriaLabel={(row) => `Ver detalle de ${row.comprador}`}
      />

      <CompradorCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <CompradorDetalleModal
        open={Boolean(detalleComprador)}
        comprador={detalleComprador}
        onClose={() => setDetalleComprador(null)}
      />

      <CompradorEditModal
        open={Boolean(editingComprador)}
        comprador={editingComprador}
        onClose={() => setEditingComprador(null)}
        onUpdated={() => {
          void reload();
        }}
      />

      <PolariaConfirmDialog
        open={Boolean(pendingToggle)}
        title={
          pendingToggle?.mode === "enable"
            ? "Habilitar comprador"
            : "Deshabilitar comprador"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar a "${pendingToggle.row.comprador}"? Volverá a aparecer en formularios.`
              : `¿Deshabilitar a "${pendingToggle.row.comprador}"? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
            : ""
        }
        confirmLabel={
          pendingToggle?.mode === "enable" ? "Habilitar" : "Deshabilitar"
        }
        isSubmitting={isToggling}
        error={toggleError}
        onClose={() => {
          if (isToggling) return;
          setPendingToggle(null);
          setToggleError(null);
        }}
        onConfirm={() => {
          void handleConfirmToggle();
        }}
      />
    </AdminCatalogListShell>
  );
}
