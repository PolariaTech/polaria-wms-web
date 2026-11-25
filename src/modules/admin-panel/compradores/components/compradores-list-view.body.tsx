"use client";

import { useCallback, useState } from "react";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { ADMIN_CATALOG_SECTION_LABEL, COMPRADORES_EMPTY_MESSAGE, COMPRADORES_PAGE_HINT, COMPRADORES_PAGE_TITLE, COMPRADORES_TABLE_SUBTITLE, COMPRADORES_TABLE_TITLE } from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import { useAdminMaestroScope, type AdminMaestroViewProps } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { listCompradoresAdmin, type CompradorListRow } from "../services/compradores.service";
import { listProductosMasVendidosAdmin } from "../services/producto-mas-vendido.service";
import { listGruposPertenecientesAdmin } from "../services/grupo-perteneciente.service";
import { CompradorCreateModal } from "./CompradorCreateModal";
import { CompradorDetalleModal } from "./CompradorDetalleModal";
import { CompradorEditModal } from "./CompradorEditModal";
import { CompradorPreciosGestionModal } from "./CompradorPreciosGestionModal";

import { useCompradoresListPreciosHandlers } from "./compradores-list-view.precios";
import { useCompradoresListColumns } from "./compradores-list-view.columns";
import { useCompradoresListToggleHandler, type PendingToggle } from "./compradores-list-view.toggle";

export function CompradoresListView({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
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
  const [isPreciosModalOpen, setIsPreciosModalOpen] = useState(false);
  const [isExportingPrecios, setIsExportingPrecios] = useState(false);
  const [isImportingPrecios, setIsImportingPrecios] = useState(false);
  const [isPrintingPrecios, setIsPrintingPrecios] = useState(false);
  const [preciosError, setPreciosError] = useState<string | null>(null);
  const [preciosStatus, setPreciosStatus] = useState<string | null>(null);

  const fetchCompradores = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listCompradoresAdmin({ codigoCuenta, soloActivos: false }),
    );
  }, [codigoCuenta, runScoped]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchCompradores,
    Boolean(codigoCuenta),
  );

  const fetchProductos = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() => listProductosMasVendidosAdmin({ codigoCuenta }));
  }, [codigoCuenta, runScoped]);

  const { data: productosData } = useAsyncQuery(
    fetchProductos,
    Boolean(codigoCuenta),
  );

  const fetchGrupos = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([] as string[]);
    }

    return runScoped(() => listGruposPertenecientesAdmin({ codigoCuenta }));
  }, [codigoCuenta, runScoped]);

  const { data: gruposData } = useAsyncQuery(
    fetchGrupos,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];
  const productos = productosData ?? [];
  const gruposDisponibles = gruposData ?? [];

  const handleConfirmToggle = useCompradoresListToggleHandler({
    codigoCuenta,
    pendingToggle,
    isToggling,
    setIsToggling,
    setToggleError,
    setPendingToggle,
    reload,
  });

  const {
    handleExportPrecios,
    handleImportPrecios,
    handlePrintPrecios,
    preciosPrintOptions,
    preciosProductoOptions,
  } = useCompradoresListPreciosHandlers({
    codigoCuenta,
    runScoped,
    reload,
    rows,
    productos,
    isExportingPrecios,
    setIsExportingPrecios,
    isImportingPrecios,
    setIsImportingPrecios,
    isPrintingPrecios,
    setIsPrintingPrecios,
    setPreciosError,
    setPreciosStatus,
    setIsPreciosModalOpen,
  });

  const columns = useCompradoresListColumns(
    setEditingComprador,
    setToggleError,
    setPendingToggle,
  );

  const preciosActions = inspect
    ? undefined
    : [
        {
          label: "Gestión de precios",
          onClick: () => {
            setPreciosError(null);
            setPreciosStatus(null);
            setIsPreciosModalOpen(true);
          },
        },
      ];

  return (
    <AdminMaestroViewShell
      inspect={inspect}
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
        columns={
          inspect
            ? columns.filter((column) => column.id !== "acciones")
            : columns
        }
        getRowKey={(row) => row.idComprador}
        emptyMessage={COMPRADORES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        additionalActions={preciosActions}
        primaryAction={
          inspect
            ? undefined
            : {
                label: "+ Cliente",
                showIcon: false,
                onClick: () => setIsCreateOpen(true),
              }
        }
        onRowClick={inspect ? undefined : (row) => setDetalleComprador(row)}
        getRowAriaLabel={
          inspect ? undefined : (row) => `Ver detalle de ${row.comprador}`
        }
      />

      <CompradorPreciosGestionModal
        open={isPreciosModalOpen}
        onClose={() => {
          if (isExportingPrecios || isImportingPrecios || isPrintingPrecios) {
            return;
          }
          setIsPreciosModalOpen(false);
          setPreciosError(null);
          setPreciosStatus(null);
        }}
        onExport={(filters) => {
          void handleExportPrecios(filters);
        }}
        onImport={(file) => {
          void handleImportPrecios(file);
        }}
        onPrint={(scope) => {
          void handlePrintPrecios(scope);
        }}
        compradores={preciosPrintOptions}
        productos={preciosProductoOptions}
        gruposDisponibles={gruposDisponibles}
        isExporting={isExportingPrecios}
        isImporting={isImportingPrecios}
        isPrinting={isPrintingPrecios}
        exportDisabled={!codigoCuenta}
        importDisabled={!codigoCuenta}
        printDisabled={!codigoCuenta || rows.length === 0}
        error={preciosError}
        status={preciosStatus}
      />

      <CompradorCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        grupoOptions={gruposDisponibles}
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
        grupoOptions={gruposDisponibles}
        onUpdated={() => {
          void reload();
        }}
      />

      <PolariaConfirmDialog
        open={Boolean(pendingToggle)}
        title={
          pendingToggle?.mode === "enable"
            ? "Habilitar cliente"
            : "Deshabilitar cliente"
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
    </AdminMaestroViewShell>
  );
}
