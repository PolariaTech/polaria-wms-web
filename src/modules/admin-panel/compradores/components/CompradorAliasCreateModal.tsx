"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { formatPrecioEs, parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  listCatalogoProductosAdmin,
  listPreciosProductoVigentesAdmin,
  type CatalogoProductoListRow,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import type { CompradorListRow } from "../services/compradores.service";
import {
  createCompradorProductoAliasAdmin,
  listCompradorProductoAliasAdmin,
} from "../services/comprador-producto-alias.service";

interface CompradorAliasCreateModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
  onCreated: () => void;
}

interface EquivalenciaCreateDraft {
  alias: string;
  precioTexto: string;
}

function formatCompradorLabel(row: CompradorListRow): string {
  return `${row.codigo} — ${row.comprador}`;
}

function precioToTexto(precio: number | undefined): string {
  if (precio == null) return "";
  return String(precio);
}

function isSamePrecio(
  original: number | undefined,
  precioTexto: string,
): boolean {
  const trimmed = precioTexto.trim();
  if (original == null) return trimmed === "";
  if (trimmed === "") return false;
  const parsed = parseDecimalEs(trimmed);
  if (parsed == null) return false;
  return Math.abs(parsed - original) < 1e-9;
}

const GRID_HEAD =
  "sticky top-0 z-[1] border-b border-polaria-t-20 bg-polaria-t-08 px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50";
const GRID_CELL =
  "border-b border-polaria-w-08 border-r border-polaria-w-08 px-0 py-0 polaria-text-body-sm last:border-r-0";
const GRID_PAD = "px-3 py-2.5";

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(haystack: string, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const normalized = normalizeSearch(haystack);
  return tokens.every((token) => normalized.includes(token));
}

export function CompradorAliasCreateModal({
  open,
  comprador,
  onClose,
  onCreated,
}: CompradorAliasCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [productos, setProductos] = useState<CatalogoProductoListRow[]>([]);
  const [aliasByProductoId, setAliasByProductoId] = useState<
    Record<string, string>
  >({});
  const [precioByProductoId, setPrecioByProductoId] = useState<
    Record<string, number>
  >({});
  const [drafts, setDrafts] = useState<Record<string, EquivalenciaCreateDraft>>(
    {},
  );
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [productoQuery, setProductoQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setProductoQuery("");
    setAliasByProductoId({});
    setPrecioByProductoId({});
    setDrafts({});
    setError(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    resetForm();

    if (!codigoCuenta) return;

    let cancelled = false;
    setIsLoadingLists(true);

    void Promise.all([
      listCatalogoProductosAdmin({ codigoCuenta, limit: 500 }),
      comprador
        ? listCompradorProductoAliasAdmin({
            codigoCuenta,
            idComprador: comprador.idComprador,
          })
        : Promise.resolve([]),
    ])
      .then(async ([nextProductos, nextAliases]) => {
        if (cancelled) return;

        const nextPrecios = await listPreciosProductoVigentesAdmin({
          codigoCuenta,
          idProductos: nextProductos.map((row) => row.idProducto),
        });

        if (cancelled) return;

        const existingAlias = Object.fromEntries(
          nextAliases.map((row) => [row.idProducto, row.alias] as const),
        );

        setProductos(nextProductos);
        setPrecioByProductoId(nextPrecios);
        setAliasByProductoId(existingAlias);
        setDrafts(
          Object.fromEntries(
            nextProductos
              .filter((row) => !existingAlias[row.idProducto]?.trim())
              .map((row) => [
                row.idProducto,
                {
                  alias: "",
                  precioTexto: precioToTexto(nextPrecios[row.idProducto]),
                },
              ]),
          ),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLists(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, comprador, open, resetForm]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((row) => {
      const precio = precioByProductoId[row.idProducto];
      const precioLabel = precio == null ? "" : formatPrecioEs(precio);
      const draft = drafts[row.idProducto];

      return matchesSearch(
        [
          row.codigo,
          row.titulo,
          aliasByProductoId[row.idProducto] ?? "",
          draft?.alias ?? "",
          precioLabel,
          draft?.precioTexto ?? "",
          row.unidad,
        ].join(" "),
        productoQuery,
      );
    });
  }, [
    aliasByProductoId,
    drafts,
    precioByProductoId,
    productoQuery,
    productos,
  ]);

  const pendingCreates = useMemo(() => {
    return productos.filter((row) => {
      if (aliasByProductoId[row.idProducto]?.trim()) return false;
      const draft = drafts[row.idProducto];
      return Boolean(draft?.alias.trim());
    });
  }, [aliasByProductoId, drafts, productos]);

  const handleDraftChange = useCallback(
    (idProducto: string, patch: Partial<EquivalenciaCreateDraft>) => {
      setDrafts((prev) => {
        const current = prev[idProducto] ?? { alias: "", precioTexto: "" };
        return {
          ...prev,
          [idProducto]: { ...current, ...patch },
        };
      });
    },
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (!comprador) {
      setError("No se encontró el comprador.");
      return;
    }

    if (pendingCreates.length === 0) {
      setError("Escribe al menos una equivalencia nueva.");
      return;
    }

    const toSave: Array<{
      row: CatalogoProductoListRow;
      alias: string;
      precioParsed: number | null;
      precioChanged: boolean;
    }> = [];

    for (const row of pendingCreates) {
      const draft = drafts[row.idProducto];
      if (!draft) continue;

      const alias = draft.alias.trim();
      if (!alias) continue;

      if (alias.length > 255) {
        setError(`La equivalencia de ${row.codigo} supera 255 caracteres.`);
        return;
      }

      const precioChanged = !isSamePrecio(
        precioByProductoId[row.idProducto],
        draft.precioTexto,
      );
      let precioParsed: number | null = null;

      if (precioChanged) {
        const trimmed = draft.precioTexto.trim();
        if (trimmed === "") {
          precioParsed = null;
        } else {
          precioParsed = parseDecimalEs(trimmed);
          if (precioParsed == null || precioParsed < 0) {
            setError(`Ingresa un precio válido para ${row.codigo}.`);
            return;
          }
        }
      }

      toSave.push({ row, alias, precioParsed, precioChanged });
    }

    setIsSubmitting(true);

    try {
      for (const item of toSave) {
        const lista = precioByProductoId[item.row.idProducto];
        const precioOverride =
          !item.precioChanged || item.precioParsed == null
            ? null
            : lista != null &&
                Math.abs(item.precioParsed - lista) < 1e-9
              ? null
              : item.precioParsed;

        await createCompradorProductoAliasAdmin({
          codigoCuenta,
          idComprador: comprador.idComprador,
          idProducto: item.row.idProducto,
          alias: item.alias,
          precio: precioOverride,
        });
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la equivalencia.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open && Boolean(comprador)}
      onClose={handleClose}
      sectionLabel="Crear equivalencia"
      title="Crear equivalencia de producto"
      description="Equivalencia y precio solo de este comprador. Si no cambias el precio, se usa la lista default."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitDisabled={pendingCreates.length === 0 || isLoadingLists}
      submitLabel="Guardar"
      cancelLabel="Cerrar"
      compact
      size="2xl"
      stackLevel="elevated"
    >
      <PolariaFormInput
        id="alias-comprador"
        label="Comprador"
        value={comprador ? formatCompradorLabel(comprador) : ""}
        readOnly
        disabled
        compact
      />

      <PolariaFormField id="alias-producto" label="Producto" compact>
        {isLoadingLists ? (
          <p className="rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
            Cargando productos…
          </p>
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
                  onChange={(event) => setProductoQuery(event.target.value)}
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
                      const existingAlias =
                        aliasByProductoId[row.idProducto]?.trim() || "";
                      const isDisabled = Boolean(existingAlias);
                      const draft = drafts[row.idProducto];
                      const precioValue = precioByProductoId[row.idProducto];
                      const precioTexto =
                        draft?.precioTexto ?? precioToTexto(precioValue);

                      return (
                        <tr
                          key={row.idProducto}
                          className={cn(
                            "text-polaria-w",
                            isDisabled && "opacity-60",
                          )}
                        >
                          <td
                            className={cn(
                              GRID_CELL,
                              GRID_PAD,
                              "font-medium",
                              isDisabled
                                ? "text-polaria-w-50"
                                : "text-polaria-teal",
                            )}
                          >
                            {row.codigo}
                          </td>
                          <td className={cn(GRID_CELL, GRID_PAD, "break-words")}>
                            {row.titulo}
                          </td>
                          <td className={GRID_CELL}>
                            {isDisabled ? (
                              <input
                                type="text"
                                value={existingAlias}
                                disabled
                                aria-label={`Equivalencia ${row.codigo} (ya creada)`}
                                className="h-full w-full cursor-not-allowed bg-transparent px-3 py-2.5 text-polaria-w-50 opacity-70 outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={draft?.alias ?? ""}
                                disabled={isSubmitting}
                                placeholder="—"
                                aria-label={`Equivalencia ${row.codigo}`}
                                onChange={(event) =>
                                  handleDraftChange(row.idProducto, {
                                    alias: event.target.value,
                                  })
                                }
                                className={cn(
                                  "h-full w-full bg-transparent px-3 py-2.5 text-polaria-w outline-none placeholder:text-polaria-w-20",
                                  "hover:bg-polaria-t-08 focus:bg-polaria-t-08 focus:ring-1 focus:ring-inset focus:ring-polaria-teal",
                                  "disabled:cursor-not-allowed disabled:opacity-60",
                                )}
                              />
                            )}
                          </td>
                          <td className={GRID_CELL}>
                            {isDisabled ? (
                              <input
                                type="text"
                                value={
                                  precioValue == null
                                    ? ""
                                    : formatPrecioEs(precioValue)
                                }
                                disabled
                                aria-label={`Precio ${row.codigo} (ya creada)`}
                                className="h-full w-full cursor-not-allowed bg-transparent px-3 py-2.5 text-right tabular-nums text-polaria-w-50 opacity-70 outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={precioTexto}
                                disabled={isSubmitting}
                                placeholder="—"
                                aria-label={`Precio ${row.codigo}`}
                                onChange={(event) =>
                                  handleDraftChange(row.idProducto, {
                                    precioTexto: event.target.value,
                                  })
                                }
                                className={cn(
                                  "h-full w-full bg-transparent px-3 py-2.5 text-right tabular-nums text-polaria-w outline-none placeholder:text-polaria-w-20",
                                  "hover:bg-polaria-t-08 focus:bg-polaria-t-08 focus:ring-1 focus:ring-inset focus:ring-polaria-teal",
                                  "disabled:cursor-not-allowed disabled:opacity-60",
                                )}
                              />
                            )}
                          </td>
                          <td className={cn(GRID_CELL, GRID_PAD)}>
                            {row.unidad}
                          </td>
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
    </PolariaFormModal>
  );
}
