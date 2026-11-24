"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  CATALOGO_EMPTY_MESSAGE,
  CATALOGO_PAGE_HINT,
  CATALOGO_PAGE_TITLE,
  CATALOGO_TABLE_SUBTITLE,
  CATALOGO_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { CATALOGO_TABLE_MIN_WIDTH_CLASS } from "../constants/catalogo-table-layout";
import {
  activateCatalogoProducto,
  deactivateCatalogoProducto,
  listCatalogoProductosAdmin,
} from "../services/productos-catalogo.service";
import {
  buildCatalogoListColumns,
  type PendingToggle,
} from "./catalogo-list-view.columns";
import { CatalogoImportFeedback } from "./catalogo-import-feedback";
import { useCatalogoImportExcel } from "./use-catalogo-import-excel";
import { ProductoCatalogoCreateModal } from "./ProductoCatalogoCreateModal";
import { ProductoCatalogoEditModal } from "./ProductoCatalogoEditModal";
import { ProductoSecundarioCreateModal } from "./ProductoSecundarioCreateModal";

export function CatalogoListViewView({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSecundarioOpen, setIsSecundarioOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchProductos = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listCatalogoProductosAdmin({
        codigoCuenta,
        soloActivos: true,
        soloMercancia: true,
      }),
    );
  }, [codigoCuenta, runScoped]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchProductos,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];
  const {
    importMessage,
    importError,
    isImporting,
    handleImportExcel,
    handleFileSelected,
  } = useCatalogoImportExcel({ codigoCuenta, fileInputRef, reload });

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateCatalogoProducto(
          codigoCuenta,
          pendingToggle.row.idProducto,
        );
      } else {
        await activateCatalogoProducto(
          codigoCuenta,
          pendingToggle.row.idProducto,
        );
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el producto."
          : "No se pudo habilitar el producto.",
      );
    } finally {
      setIsToggling(false);
    }
  }, [codigoCuenta, isToggling, pendingToggle, reload]);

  const columns = useMemo(
    () =>
      buildCatalogoListColumns({
        inspect,
        setEditingProductId,
        setPendingToggle,
        setToggleError,
      }),
    [inspect],
  );

  return (
    <AdminMaestroViewShell
      inspect={inspect}
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={CATALOGO_PAGE_TITLE}
      hint={CATALOGO_PAGE_HINT}
    >
      {inspect ? null : (
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          void handleFileSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      )}

      <CatalogoImportFeedback
        importMessage={importMessage}
        importError={importError}
      />

      <PolariaDataTable
        title={CATALOGO_TABLE_TITLE}
        subtitle={CATALOGO_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        tableClassName={CATALOGO_TABLE_MIN_WIDTH_CLASS}
        getRowKey={(row) => row.idProducto}
        emptyMessage={CATALOGO_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing || isImporting}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar producto",
        }}
        additionalActions={
          inspect
            ? undefined
            : [
                {
                  label: isImporting ? "Importando Excel" : "Importar Excel",
                  onClick: handleImportExcel,
                  disabled: !codigoCuenta || isImporting,
                  variant: "outline",
                  iconOnly: true,
                  icon: (
                    <FileSpreadsheet
                      className="h-4 w-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ),
                },
                {
                  label: "Lista de precio",
                  onClick: () => {
                    router.push(ROUTES.dashboardListaPrecio);
                  },
                  variant: "outline",
                },
                {
                  label: "Secundario",
                  onClick: () => setIsSecundarioOpen(true),
                  variant: "outline",
                },
              ]
        }
        primaryAction={
          inspect
            ? undefined
            : {
                label: "Nuevo producto",
                onClick: () => setIsCreateOpen(true),
                showIcon: false,
              }
        }
      />

      <ProductoCatalogoCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <ProductoCatalogoEditModal
        open={Boolean(editingProductId)}
        idProducto={editingProductId}
        onClose={() => setEditingProductId(null)}
        onUpdated={() => {
          void reload();
        }}
      />

      <ProductoSecundarioCreateModal
        open={isSecundarioOpen}
        onClose={() => setIsSecundarioOpen(false)}
        onCreated={() => {
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
            ? "Habilitar producto"
            : "Deshabilitar producto"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar el producto "${pendingToggle.row.titulo}" (${pendingToggle.row.sku})? Volverá a aparecer en el catálogo y en formularios.`
              : `¿Deshabilitar el producto "${pendingToggle.row.titulo}" (${pendingToggle.row.sku})? Dejará de aparecer en el catálogo y en formularios.`
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
