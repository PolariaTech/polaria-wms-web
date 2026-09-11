"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import { cn } from "@/lib/utils/cn";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  CATALOGO_EMPTY_MESSAGE,
  CATALOGO_PAGE_HINT,
  CATALOGO_PAGE_TITLE,
  CATALOGO_TABLE_SUBTITLE,
  CATALOGO_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  applyCatalogoColumnWidths,
  CATALOGO_TABLE_MIN_WIDTH_CLASS,
} from "../constants/catalogo-table-layout";
import {
  activateCatalogoProducto,
  deactivateCatalogoProducto,
  importCatalogoProductosFromFile,
  listCatalogoProductosAdmin,
  type CatalogoProductoListRow,
} from "../services/productos-catalogo.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { ProductoCatalogoCreateModal } from "./ProductoCatalogoCreateModal";
import { ProductoCatalogoEditModal } from "./ProductoCatalogoEditModal";
import { ProductoSecundarioCreateModal } from "./ProductoSecundarioCreateModal";

type PendingToggle = { row: CatalogoProductoListRow; mode: "disable" | "enable" };

export function CatalogoListView() {
  const { codigoCuenta } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
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

    return listCatalogoProductosAdmin({
      codigoCuenta,
      search,
      soloActivos: false,
    });
  }, [codigoCuenta, search]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchProductos,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

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

  const handleImportExcel = () => {
    if (!codigoCuenta || isImporting) return;
    setImportMessage(null);
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file || !codigoCuenta) return;

    setIsImporting(true);
    setImportMessage(null);
    setImportError(null);

    try {
      const result = await importCatalogoProductosFromFile(codigoCuenta, file);

      if (result.imported > 0) {
        await reload();
      }

      const parts: string[] = [];

      if (result.imported > 0) {
        parts.push(`Se importaron ${result.imported} producto(s) desde ${file.name}.`);
      }

      if (result.skipped > 0) {
        parts.push(`${result.skipped} fila(s) omitida(s) por datos incompletos.`);
      }

      if (result.errors.length) {
        parts.push(`${result.errors.length} fila(s) con error.`);
      }

      if (parts.length) {
        setImportMessage(parts.join(" "));
      } else if (result.imported === 0) {
        setImportError("No se importó ningún producto.");
      }

      if (result.errors.length) {
        setImportError(result.errors.slice(0, 5).join(" "));
      }
    } catch (err: unknown) {
      setImportError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar el archivo de importación.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const columns = useMemo(
    () =>
      applyCatalogoColumnWidths([
        {
          id: "codigo",
          header: "Código",
          cell: (row: CatalogoProductoListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        { id: "titulo", header: "Título", cell: (row: CatalogoProductoListRow) => row.titulo },
        { id: "slug", header: "Slug", cell: (row: CatalogoProductoListRow) => row.slug },
        {
          id: "descripcion",
          header: "Descripción",
          cell: (row: CatalogoProductoListRow) => row.descripcion,
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: CatalogoProductoListRow) => row.proveedor,
        },
        {
          id: "categoria",
          header: "Categoría",
          cell: (row: CatalogoProductoListRow) => row.categoria,
        },
        { id: "tipo", header: "Tipo", cell: (row: CatalogoProductoListRow) => row.tipo },
        {
          id: "etiquetas",
          header: "Etiquetas",
          cell: (row: CatalogoProductoListRow) => row.etiquetas,
        },
        {
          id: "publicado",
          header: "Publicado",
          cell: (row: CatalogoProductoListRow) => row.publicado,
        },
        { id: "estado", header: "Estado", cell: (row: CatalogoProductoListRow) => row.estado },
        { id: "sku", header: "SKU", cell: (row: CatalogoProductoListRow) => row.sku },
        {
          id: "codigo-barras",
          header: "Cód. Barras",
          cell: (row: CatalogoProductoListRow) => row.codigoBarras,
        },
        {
          id: "nombre-op-1",
          header: "Nombre Op 1",
          cell: (row: CatalogoProductoListRow) => row.nombreOpcion1,
        },
        {
          id: "valor-op-1",
          header: "Valor Op 1",
          cell: (row: CatalogoProductoListRow) => row.valorOpcion1,
        },
        {
          id: "vinculado",
          header: "Vinculado",
          cell: (row: CatalogoProductoListRow) => row.vinculado,
        },
        { id: "unidad", header: "Unidad", cell: (row: CatalogoProductoListRow) => row.unidad },
        {
          id: "impuesto",
          header: "Impuesto",
          cell: (row: CatalogoProductoListRow) => row.impuesto,
        },
        {
          id: "tracker",
          header: "Tracker inv.",
          cell: (row: CatalogoProductoListRow) => row.trackerInventario,
        },
        {
          id: "vigencia",
          header: "Vigencia",
          cell: (row: CatalogoProductoListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CatalogoProductoListRow) => (
            <PolariaTableActionGroup>
              <PolariaTableEditButton
                disabled={!row.estaActivo}
                onClick={() => setEditingProductId(row.idProducto)}
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
      ]),
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={CATALOGO_PAGE_TITLE}
      hint={CATALOGO_PAGE_HINT}
    >
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

      {importMessage ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w-50"
        >
          {importMessage}
        </p>
      ) : null}

      {importError ? (
        <p
          role="alert"
          className={cn(
            "mb-4 rounded-lg border px-3 py-2 polaria-text-body-sm",
            importMessage
              ? "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning"
              : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w-50",
          )}
        >
          {importError}
        </p>
      ) : null}

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
        additionalActions={[
          {
            label: isImporting ? "Importando…" : "Importar Excel",
            onClick: handleImportExcel,
            disabled: !codigoCuenta || isImporting,
            variant: "outline",
          },
          {
            label: "Crear secundario",
            onClick: () => setIsSecundarioOpen(true),
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Nuevo producto",
          onClick: () => setIsCreateOpen(true),
        }}
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
              ? `¿Habilitar el producto "${pendingToggle.row.titulo}" (${pendingToggle.row.sku})? Volverá a aparecer en formularios.`
              : `¿Deshabilitar el producto "${pendingToggle.row.titulo}" (${pendingToggle.row.sku})? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
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
