"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PolariaDataTable,
  type PolariaDataTableColumn,
} from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { filterRowsBySearch } from "@/components/shared/table/polaria-table-search";
import { POLARIA_FORM_INPUT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  LISTA_PRECIO_EMPTY_MESSAGE,
  LISTA_PRECIO_PAGE_HINT,
  LISTA_PRECIO_PAGE_TITLE,
  LISTA_PRECIO_TABLE_SUBTITLE,
  LISTA_PRECIO_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import {
  insertPrecioProductoVigenteAdmin,
  listCatalogoProductosAdmin,
  listPreciosProductoVigentesAdmin,
  type CatalogoProductoListRow,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";

interface ListaPrecioRow {
  idProducto: string;
  codigo: string;
  nombre: string;
  unidad: string;
  precioVigente: number | null;
  estaActivo: boolean;
}

function toListaRow(
  producto: CatalogoProductoListRow,
  precioById: Record<string, number>,
): ListaPrecioRow {
  const precioVigente = precioById[producto.idProducto];
  return {
    idProducto: producto.idProducto,
    codigo: producto.codigo,
    nombre: producto.titulo,
    unidad: producto.unidad?.trim() || "—",
    precioVigente:
      precioVigente !== undefined && precioVigente !== null
        ? precioVigente
        : null,
    estaActivo: producto.estaActivo,
  };
}

export function ListaPrecioListView() {
  const { codigoCuenta } = useCompany();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRows = useCallback(async (): Promise<ListaPrecioRow[]> => {
    if (!codigoCuenta) return [];

    const productos = await listCatalogoProductosAdmin({
      codigoCuenta,
      soloActivos: false,
    });
    const precios = await listPreciosProductoVigentesAdmin({
      codigoCuenta,
      idProductos: productos.map((row) => row.idProducto),
    });
    return productos.map((row) => toListaRow(row, precios));
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error: loadError, reload } =
    useAsyncQuery(fetchRows, Boolean(codigoCuenta));

  const allRows = data ?? [];
  const rows = useMemo(
    () => filterRowsBySearch(allRows, search),
    [allRows, search],
  );

  useEffect(() => {
    setDrafts({});
    setSaveError(null);
  }, [data]);

  const dirtyIds = useMemo(() => {
    const ids: string[] = [];
    for (const row of allRows) {
      const draft = drafts[row.idProducto];
      if (draft === undefined) continue;
      const current =
        row.precioVigente == null ? "" : String(row.precioVigente);
      if (draft.trim() !== current.trim()) {
        ids.push(row.idProducto);
      }
    }
    return ids;
  }, [allRows, drafts]);

  const handleSave = useCallback(async () => {
    if (!codigoCuenta || dirtyIds.length === 0 || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      for (const idProducto of dirtyIds) {
        const texto = (drafts[idProducto] ?? "").trim();
        if (texto === "") {
          throw new DomainServiceError(
            "Todos los precios editados deben tener un valor (0 o mayor).",
            "INVALID_ARGUMENT",
          );
        }
        const precio = parseDecimalEs(texto);
        if (precio == null || precio < 0) {
          throw new DomainServiceError(
            "Ingresa un precio válido (0 o mayor).",
            "INVALID_ARGUMENT",
          );
        }
        await insertPrecioProductoVigenteAdmin({
          codigoCuenta,
          idProducto,
          precio,
        });
      }
      setDrafts({});
      await reload();
    } catch (err: unknown) {
      setSaveError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la lista de precios.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [codigoCuenta, dirtyIds, drafts, isSaving, reload]);

  const columns = useMemo<PolariaDataTableColumn<ListaPrecioRow>[]>(
    () => [
      {
        id: "codigo",
        header: "Código",
        cell: (row) => <PolariaTableCode>{row.codigo}</PolariaTableCode>,
      },
      {
        id: "nombre",
        header: "Producto",
        cell: (row) => row.nombre,
      },
      {
        id: "unidad",
        header: "Unidad",
        cell: (row) => row.unidad,
      },
      {
        id: "precio",
        header: "Precio default",
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (row) => {
          const draft =
            drafts[row.idProducto] ??
            (row.precioVigente == null ? "" : String(row.precioVigente));
          const isDirty = dirtyIds.includes(row.idProducto);
          return (
            <input
              aria-label={`Precio de ${row.nombre}`}
              type="text"
              inputMode="decimal"
              value={draft}
              placeholder="Sin precio"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const value = event.target.value;
                setDrafts((prev) => ({
                  ...prev,
                  [row.idProducto]: value,
                }));
              }}
              className={cn(
                POLARIA_FORM_INPUT_CLASS_COMPACT,
                "max-w-[8rem] text-right",
                isDirty && "!border-polaria-teal/50 !bg-polaria-t-08",
              )}
            />
          );
        },
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row) => (
          <PolariaTableBadge
            variant={row.estaActivo ? "positive" : "neutral"}
          >
            {row.estaActivo ? "Activo" : "Inactivo"}
          </PolariaTableBadge>
        ),
      },
    ],
    [dirtyIds, drafts],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={LISTA_PRECIO_PAGE_TITLE}
      hint={LISTA_PRECIO_PAGE_HINT}
    >
      <PolariaDataTable
        title={LISTA_PRECIO_TABLE_TITLE}
        subtitle={LISTA_PRECIO_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          saveError ??
          loadError ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idProducto}
        emptyMessage={LISTA_PRECIO_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing || isSaving}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar producto",
        }}
        additionalActions={[
          {
            label: isSaving
              ? "Guardando…"
              : dirtyIds.length > 0
                ? `Guardar (${dirtyIds.length})`
                : "Guardar",
            onClick: () => {
              void handleSave();
            },
            variant: "primary",
            disabled: dirtyIds.length === 0 || isSaving || !codigoCuenta,
            title:
              dirtyIds.length === 0
                ? "Edita un precio para habilitar Guardar"
                : undefined,
          },
        ]}
      />
    </AdminCatalogListShell>
  );
}
