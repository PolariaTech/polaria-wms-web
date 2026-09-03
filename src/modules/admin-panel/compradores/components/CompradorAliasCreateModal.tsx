"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
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

function formatCompradorLabel(row: CompradorListRow): string {
  return `${row.codigo} — ${row.comprador}`;
}

const GRID_HEAD_CELL =
  "sticky top-0 z-10 border border-polaria-t-20 px-2.5 py-2 text-left polaria-text-caption font-medium text-polaria-w-50 bg-[color-mix(in_srgb,var(--bg)_88%,var(--teal)_12%)]";

const GRID_CELL =
  "border border-polaria-t-20 px-2.5 py-2 align-middle polaria-text-body-sm";

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
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [producto, setProducto] = useState<CatalogoProductoListRow | null>(null);
  const [alias, setAlias] = useState("");
  const [productoQuery, setProductoQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);

  const isAliasOpen = Boolean(comprador && producto);

  const resetForm = useCallback(() => {
    setProducto(null);
    setAlias("");
    setProductoQuery("");
    setAliasByProductoId({});
    setPrecioByProductoId({});
    setError(null);
    setAliasError(null);
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

        setProductos(nextProductos);
        setPrecioByProductoId(nextPrecios);
        setAliasByProductoId(
          Object.fromEntries(
            nextAliases.map((row) => [row.idProducto, row.alias] as const),
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

  const handleCloseAlias = useCallback(() => {
    if (isSubmitting) return;
    setProducto(null);
    setAlias("");
    setAliasError(null);
  }, [isSubmitting]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((row) => {
      const precio = precioByProductoId[row.idProducto];
      const precioLabel =
        precio == null ? "" : formatPrecioEs(precio);

      return matchesSearch(
        [
          row.codigo,
          row.titulo,
          aliasByProductoId[row.idProducto] ?? "",
          precioLabel,
          row.unidad,
        ].join(" "),
        productoQuery,
      );
    });
  }, [aliasByProductoId, precioByProductoId, productoQuery, productos]);

  const handleSubmitAlias = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAliasError(null);

    if (!codigoCuenta) {
      setAliasError("No se encontró la cuenta activa.");
      return;
    }

    if (!comprador) {
      setAliasError("No se encontró el comprador.");
      return;
    }

    if (!producto) {
      setAliasError("Selecciona un producto del catálogo.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCompradorProductoAliasAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
        idProducto: producto.idProducto,
        alias,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setAliasError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar el alias.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PolariaFormModal
        open={open && Boolean(comprador)}
        onClose={handleClose}
        sectionLabel="Crear alias"
        title="Crear alias de producto"
        description="Elige el producto. El alias se pide en el siguiente paso."
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        error={error}
        footerAction={<></>}
        cancelLabel="Cerrar"
        compact
        size="2xl"
        stackLevel="elevated"
        closeOnEscape={!isAliasOpen}
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
                <div className="max-h-[min(48dvh,22rem)] overflow-auto rounded-lg border border-polaria-t-20">
                  <table className="w-full min-w-[48rem] border-collapse text-left">
                    <colgroup>
                      <col className="w-[7.5rem]" />
                      <col />
                      <col className="w-[11rem]" />
                      <col className="w-[7.5rem]" />
                      <col className="w-[9rem]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={GRID_HEAD_CELL}>Código</th>
                        <th className={GRID_HEAD_CELL}>Nombre</th>
                        <th className={GRID_HEAD_CELL}>Alias</th>
                        <th className={`${GRID_HEAD_CELL} text-right`}>
                          Precio
                        </th>
                        <th className={GRID_HEAD_CELL}>Unidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((row) => {
                        const isSelected =
                          row.idProducto === producto?.idProducto;
                        const aliasValue =
                          aliasByProductoId[row.idProducto]?.trim() || "";
                        const precioValue = precioByProductoId[row.idProducto];

                        return (
                          <tr
                            key={row.idProducto}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (!isSubmitting) {
                                setAlias("");
                                setAliasError(null);
                                setProducto(row);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                if (!isSubmitting) {
                                  setAlias("");
                                  setAliasError(null);
                                  setProducto(row);
                                }
                              }
                            }}
                            aria-label={`Seleccionar ${row.titulo}`}
                            aria-pressed={isSelected}
                            className={cn(
                              "cursor-pointer transition",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                              isSelected
                                ? "bg-polaria-t-08 text-polaria-w"
                                : "text-polaria-w hover:bg-polaria-t-08",
                            )}
                          >
                            <td
                              className={`${GRID_CELL} font-medium text-polaria-teal`}
                            >
                              {row.codigo}
                            </td>
                            <td className={`${GRID_CELL} break-words`}>
                              {row.titulo}
                            </td>
                            <td
                              className={cn(
                                GRID_CELL,
                                aliasValue
                                  ? "text-polaria-w"
                                  : "text-polaria-w-50",
                              )}
                            >
                              {aliasValue || "—"}
                            </td>
                            <td
                              className={cn(
                                GRID_CELL,
                                "text-right tabular-nums",
                                precioValue == null
                                  ? "text-polaria-w-50"
                                  : undefined,
                              )}
                            >
                              {precioValue == null
                                ? "—"
                                : formatPrecioEs(precioValue)}
                            </td>
                            <td className={GRID_CELL}>{row.unidad}</td>
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

      <PolariaFormModal
        open={open && isAliasOpen}
        onClose={handleCloseAlias}
        sectionLabel="Crear alias"
        title="Alias del producto"
        description={
          producto
            ? `${producto.codigo} — ${producto.titulo}`
            : "Nombre con el que este comprador conoce el producto."
        }
        onSubmit={(event) => {
          void handleSubmitAlias(event);
        }}
        error={aliasError}
        isSubmitting={isSubmitting}
        submitLabel="Guardar"
        compact
        size="sm"
        stackLevel="nested"
      >
        <PolariaFormInput
          id="alias-nombre"
          label="Alias"
          value={alias}
          placeholder="Ej. Patilla"
          onChange={(event) => setAlias(event.target.value)}
          disabled={isSubmitting}
          hint="Nombre con el que este comprador conoce el producto."
          autoFocus
          compact
        />
      </PolariaFormModal>
    </>
  );
}
