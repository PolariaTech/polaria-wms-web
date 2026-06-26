"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
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
  listCatalogoProductosAdmin,
  type CatalogoProductoListRow,
} from "../services/productos-catalogo.service";
import { AdminCatalogListShell } from "./AdminCatalogListShell";
import { ProductoCatalogoCreateModal } from "./ProductoCatalogoCreateModal";
import { ProductoSecundarioCreateModal } from "./ProductoSecundarioCreateModal";

export function CatalogoListView() {
  const { codigoCuenta } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSecundarioOpen, setIsSecundarioOpen] = useState(false);

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

  const columns = useMemo(
    () =>
      [
        {
          id: "id-num",
          header: "ID Num",
          cell: (row: CatalogoProductoListRow) => row.idNum,
        },
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
          cell: () => <PolariaTableEditButton />,
        },
      ] as const,
    [],
  );

  const handleImportExcel = () => {
    setImportMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;

    setImportMessage(
      `Importación Excel pendiente de implementación (${file.name}).`,
    );
  };

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
          handleFileSelected(event.target.files?.[0]);
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
        getRowKey={(row) => row.idProducto}
        emptyMessage={CATALOGO_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar producto",
        }}
        additionalActions={[
          {
            label: "Importar Excel",
            onClick: handleImportExcel,
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
