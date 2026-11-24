"use client";

import { Search } from "lucide-react";
import {
  PolariaFormField,
} from "@/components/shared/form/PolariaFormField";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { cn } from "@/lib/utils/cn";
import type { CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import {
  GRID_CELL,
  GRID_HEAD,
  GRID_PAD,
  precioToTexto,
  type EquivalenciaCreateDraft,
} from "./comprador-alias-create-modal.helpers";

export function CompradorAliasCreateProductField({
  isLoadingLists,
  isSubmitting,
  productos,
  productosFiltrados,
  productoQuery,
  onProductoQueryChange,
  drafts,
  precioByProductoId,
  onDraftChange,
}: {
  isLoadingLists: boolean;
  isSubmitting: boolean;
  productos: CatalogoProductoListRow[];
  productosFiltrados: CatalogoProductoListRow[];
  productoQuery: string;
  onProductoQueryChange: (value: string) => void;
  drafts: Record<string, EquivalenciaCreateDraft>;
  precioByProductoId: Record<string, number>;
  onDraftChange: (idProducto: string, patch: Partial<EquivalenciaCreateDraft>) => void;
}) {
  return (
    <PolariaFormField id="alias-producto" label="Producto" compact>
      {isLoadingLists ? (
        <PolariaStatusLoading
          embedded
          title="Cargando productos…"
          message="Estamos preparando el catálogo."
          className="py-4"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {productos.length > 4 ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
                aria-hidden
              />
              <input
                type="search"
                value={productoQuery}
                onChange={(event) => onProductoQueryChange(event.target.value)}
                placeholder="Buscar por código o nombre"
                aria-label="Buscar producto"
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-lg border border-polaria-w-08 bg-polaria-w-08 py-2 pl-10 pr-3",
                  "text-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
                  "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
                )}
              />
            </div>
          ) : null}

          {productosFiltrados.length === 0 ? (
            <p className="rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
              {productoQuery.trim()
                ? "No hay productos que coincidan con la búsqueda."
                : "No hay productos en el catálogo."}
            </p>
          ) : (
            <div className="max-h-[min(48dvh,22rem)] overflow-auto rounded-xl border border-polaria-t-20">
              <table className="w-full min-w-[48rem] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[7.5rem]" />
                  <col />
                  <col className="w-[12rem]" />
                  <col className="w-[8rem]" />
                  <col className="w-[9rem]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className={GRID_HEAD}>Código</th>
                    <th className={GRID_HEAD}>Nombre</th>
                    <th className={GRID_HEAD}>Equivalencia</th>
                    <th className={`${GRID_HEAD} text-right`}>Precio</th>
                    <th className={GRID_HEAD}>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((row) => {
                    const draft = drafts[row.idProducto];
                    const precioValue = precioByProductoId[row.idProducto];
                    const precioTexto =
                      draft?.precioTexto ?? precioToTexto(precioValue);
                    const inputClass = cn(
                      "h-full w-full bg-transparent px-3 py-2.5 text-polaria-w outline-none placeholder:text-polaria-w-20",
                      "hover:bg-polaria-t-08 focus:bg-polaria-t-08 focus:ring-1 focus:ring-inset focus:ring-polaria-teal",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    );

                    return (
                      <tr key={row.idProducto} className="text-polaria-w">
                        <td
                          className={cn(
                            GRID_CELL,
                            GRID_PAD,
                            "font-medium text-polaria-teal",
                          )}
                        >
                          {row.codigo}
                        </td>
                        <td className={cn(GRID_CELL, GRID_PAD, "break-words")}>
                          {row.titulo}
                        </td>
                        <td className={GRID_CELL}>
                          <input
                            type="text"
                            value={draft?.alias ?? ""}
                            disabled={isSubmitting}
                            placeholder="—"
                            aria-label={`Equivalencia ${row.codigo}`}
                            onChange={(event) =>
                              onDraftChange(row.idProducto, {
                                alias: event.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </td>
                        <td className={GRID_CELL}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={precioTexto}
                            disabled={isSubmitting}
                            placeholder="—"
                            aria-label={`Precio ${row.codigo}`}
                            onChange={(event) =>
                              onDraftChange(row.idProducto, {
                                precioTexto: event.target.value.replace(/[^\d.,]/g, ""),
                              })
                            }
                            className={cn(inputClass, "text-right tabular-nums")}
                          />
                        </td>
                        <td className={cn(GRID_CELL, GRID_PAD)}>{row.unidad}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PolariaFormField>
  );
}