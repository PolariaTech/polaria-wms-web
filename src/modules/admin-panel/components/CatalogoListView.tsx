"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableCode,
  PolariaTableDeleteButton,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { cn } from "@/lib/cn";
import { useCompany } from "@/providers/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  CATALOGO_EMPTY_MESSAGE,
  CATALOGO_PAGE_HINT,
  CATALOGO_PAGE_TITLE,
  CATALOGO_TABLE_SUBTITLE,
  CATALOGO_TABLE_TITLE,
} from "../constants/admin-catalog-list";
import {
  applyCatalogoColumnWidths,
  CATALOGO_TABLE_MIN_WIDTH_CLASS,
} from "../constants/catalogo-table-layout";
import {
  deactivateCatalogoProducto,
  importCatalogoProductosFromFile,
  listCatalogoProductosAdmin,
  type CatalogoProductoListRow,
} from "../services/productos-catalogo.service";
import { AdminCatalogListShell } from "./AdminCatalogListShell";
import { ProductoCatalogoCreateModal } from "./ProductoCatalogoCreateModal";
import { ProductoCatalogoEditModal } from "./ProductoCatalogoEditModal";
import { ProductoSecundarioCreateModal } from "./ProductoSecundarioCreateModal";

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
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const fetchProductos = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listCatalogoProductosAdmin({ codigoCuenta, search });
  }, [codigoCuenta, search]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchProductos,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const handleDelete = useCallback(
    async (row: CatalogoProductoListRow) => {
      if (!codigoCuenta || deletingProductId) return;

      const confirmed = window.confirm(
        `¿Eliminar el producto "${row.titulo}" (${row.sku})?`,
      );
      if (!confirmed) return;

      setDeletingProductId(row.idProducto);

      try {
        await deactivateCatalogoProducto(codigoCuenta, row.idProducto);
        await reload();
      } catch {
        window.alert("No se pudo eliminar el producto.");
      } finally {
        setDeletingProductId(null);
      }
    },
    [codigoCuenta, deletingProductId, reload],
  );

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
        { id: "precio", header: "Precio", cell: (row: CatalogoProductoListRow) => row.precio },
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
        { id: "stock", header: "Stock", cell: (row: CatalogoProductoListRow) => row.stock },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CatalogoProductoListRow) => (
            <div className="flex flex-wrap items-center gap-2">
              <PolariaTableEditButton
                onClick={() => setEditingProductId(row.idProducto)}
              />
              <PolariaTableDeleteButton
                disabled={deletingProductId === row.idProducto}
                onClick={() => {
                  void handleDelete(row);
                }}
              />
            </div>
          ),
        },
      ]),
    [deletingProductId, handleDelete],
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
    </AdminCatalogListShell>
  );
}
