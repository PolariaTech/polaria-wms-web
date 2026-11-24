"use client";

import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDisableButton,
  PolariaTableEditButton,
  PolariaTableEnableButton,
} from "@/components/shared/table/PolariaTableCells";
import { applyCatalogoColumnWidths } from "../constants/catalogo-table-layout";
import type { CatalogoProductoListRow } from "../services/productos-catalogo.service";

export type PendingToggle = {
  row: CatalogoProductoListRow;
  mode: "disable" | "enable";
};

interface BuildCatalogoColumnsParams {
  inspect: boolean;
  setEditingProductId: (id: string) => void;
  setPendingToggle: (value: PendingToggle | null) => void;
  setToggleError: (value: string | null) => void;
}

export function buildCatalogoListColumns({
  inspect,
  setEditingProductId,
  setPendingToggle,
  setToggleError,
}: BuildCatalogoColumnsParams) {
  return applyCatalogoColumnWidths([
    {
      id: "codigo",
      header: "Código",
      cell: (row: CatalogoProductoListRow) => (
        <PolariaTableCode>{row.codigo}</PolariaTableCode>
      ),
    },
    {
      id: "titulo",
      header: "Título",
      cell: (row: CatalogoProductoListRow) => row.titulo,
    },
    {
      id: "slug",
      header: "Slug",
      cell: (row: CatalogoProductoListRow) => row.slug,
    },
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
    {
      id: "tipo",
      header: "Tipo",
      cell: (row: CatalogoProductoListRow) => row.tipo,
    },
    {
      id: "tipo-producto",
      header: "Tipo producto",
      cell: (row: CatalogoProductoListRow) => row.tipoProducto,
    },
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
    {
      id: "estado",
      header: "Estado",
      cell: (row: CatalogoProductoListRow) => row.estado,
    },
    {
      id: "sku",
      header: "SKU",
      cell: (row: CatalogoProductoListRow) => row.sku,
    },
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
    {
      id: "unidad",
      header: "Unidad",
      cell: (row: CatalogoProductoListRow) => row.unidad,
    },
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
    ...(inspect
      ? []
      : [
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
  ]);
}
