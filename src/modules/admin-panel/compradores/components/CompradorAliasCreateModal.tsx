"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  listCatalogoProductosAdmin,
  type CatalogoProductoListRow,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import { listCompradoresAdmin, type CompradorListRow } from "../services/compradores.service";
import { createCompradorProductoAliasAdmin } from "../services/comprador-producto-alias.service";

interface CompradorAliasCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function formatCompradorLabel(row: CompradorListRow): string {
  return `${row.codigo} — ${row.comprador}`;
}

const STICKY_HEAD_CELL =
  "sticky top-0 z-10 border-b border-polaria-t-20 px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50 bg-[color-mix(in_srgb,var(--bg)_92%,var(--teal)_8%)]";

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
  onClose,
  onCreated,
}: CompradorAliasCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [compradores, setCompradores] = useState<CompradorListRow[]>([]);
  const [productos, setProductos] = useState<CatalogoProductoListRow[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [comprador, setComprador] = useState<CompradorListRow | null>(null);
  const [producto, setProducto] = useState<CatalogoProductoListRow | null>(null);
  const [alias, setAlias] = useState("");
  const [productoQuery, setProductoQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompradorPickerOpen, setIsCompradorPickerOpen] = useState(false);
  const [compradorQuery, setCompradorQuery] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);

  const isAliasOpen = Boolean(comprador && producto);

  const resetForm = useCallback(() => {
    setComprador(null);
    setProducto(null);
    setAlias("");
    setProductoQuery("");
    setError(null);
    setAliasError(null);
    setIsSubmitting(false);
    setIsCompradorPickerOpen(false);
    setCompradorQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;

    resetForm();

    if (!codigoCuenta) return;

    let cancelled = false;
    setIsLoadingLists(true);

    void Promise.all([
      listCompradoresAdmin({ codigoCuenta }),
      listCatalogoProductosAdmin({ codigoCuenta, limit: 500 }),
    ])
      .then(([nextCompradores, nextProductos]) => {
        if (cancelled) return;
        setCompradores(nextCompradores);
        setProductos(nextProductos);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar compradores o productos.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLists(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, open, resetForm]);

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
    return productos.filter((row) =>
      matchesSearch(`${row.codigo} ${row.titulo}`, productoQuery),
    );
  }, [productoQuery, productos]);

  const compradoresFiltrados = useMemo(() => {
    return compradores.filter((row) =>
      matchesSearch(`${row.codigo} ${row.comprador}`, compradorQuery),
    );
  }, [compradorQuery, compradores]);

  const handleSubmitAlias = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAliasError(null);

    if (!codigoCuenta) {
      setAliasError("No se encontró la cuenta activa.");
      return;
    }

    if (!comprador) {
      setAliasError("Selecciona un comprador.");
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
        open={open}
        onClose={handleClose}
        sectionLabel="Crear alias"
        title="Crear alias de producto"
        description="Elige el comprador y el producto. El alias se pide en el siguiente paso."
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        error={error}
        footerAction={<></>}
        cancelLabel="Cerrar"
        compact
        size="xl"
        closeOnEscape={!isCompradorPickerOpen && !isAliasOpen}
      >
        <PolariaFormField id="alias-comprador" label="Comprador" compact>
          <JefeBodegaModalSearchField
            id="alias-comprador"
            value={comprador ? formatCompradorLabel(comprador) : ""}
            placeholder={
              isLoadingLists ? "Cargando compradores…" : "Selecciona un comprador"
            }
            ariaLabel="Comprador"
            onSearchClick={
              isSubmitting || isLoadingLists
                ? undefined
                : () => setIsCompradorPickerOpen(true)
            }
          />
        </PolariaFormField>

        {comprador ? (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-polaria-w">Producto</p>
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
                <div className="max-h-[min(40dvh,18rem)] overflow-auto rounded-xl border border-polaria-w-08">
                  <table className="w-full table-fixed border-separate border-spacing-0 text-left">
                    <colgroup>
                      <col className="w-[32%]" />
                      <col className="w-[68%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={STICKY_HEAD_CELL}>Código</th>
                        <th className={STICKY_HEAD_CELL}>Nombre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((row) => {
                        const isSelected = row.idProducto === producto?.idProducto;
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
                              "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                              isSelected
                                ? "bg-polaria-t-08 text-polaria-w"
                                : "text-polaria-w hover:bg-polaria-t-08",
                            )}
                          >
                            <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                              {row.codigo}
                            </td>
                            <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                              {row.titulo}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
            Primero selecciona un comprador para ver el catálogo.
          </p>
        )}
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
        stackLevel="elevated"
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

      <PolariaFormModal
        open={open && isCompradorPickerOpen}
        onClose={() => {
          setIsCompradorPickerOpen(false);
          setCompradorQuery("");
        }}
        title="Seleccionar comprador"
        description="Compradores activos de la cuenta."
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        hideHeaderClose
        footerAction={<></>}
        cancelLabel="Cerrar"
        compact
        size="md"
        stackLevel="elevated"
      >
        {compradores.length > 4 ? (
          <div className="relative mb-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
              aria-hidden
            />
            <input
              type="search"
              value={compradorQuery}
              onChange={(event) => setCompradorQuery(event.target.value)}
              placeholder="Buscar por código o nombre"
              aria-label="Buscar comprador"
              className={cn(
                "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
                "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
                "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
              )}
            />
          </div>
        ) : null}

        {compradoresFiltrados.length === 0 ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
            {compradorQuery.trim()
              ? "No hay compradores que coincidan con la búsqueda."
              : "No hay compradores registrados."}
          </p>
        ) : (
          <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[68%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={STICKY_HEAD_CELL}>Código</th>
                  <th className={STICKY_HEAD_CELL}>Comprador</th>
                </tr>
              </thead>
              <tbody>
                {compradoresFiltrados.map((row) => {
                  const isSelected = row.idComprador === comprador?.idComprador;
                  return (
                    <tr
                      key={row.idComprador}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setComprador(row);
                        setProducto(null);
                        setAlias("");
                        setIsCompradorPickerOpen(false);
                        setCompradorQuery("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setComprador(row);
                          setProducto(null);
                          setAlias("");
                          setIsCompradorPickerOpen(false);
                          setCompradorQuery("");
                        }
                      }}
                      aria-label={`Seleccionar ${row.comprador}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                        isSelected
                          ? "bg-polaria-t-08 text-polaria-w"
                          : "text-polaria-w hover:bg-polaria-t-08",
                      )}
                    >
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                        {row.codigo}
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                        {row.comprador}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PolariaFormModal>
    </>
  );
}
