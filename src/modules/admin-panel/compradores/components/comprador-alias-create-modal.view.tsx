"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { listCatalogoProductosAdmin, listPreciosProductoVigentesAdmin, type CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import type { CompradorListRow } from "../services/compradores.service";
import { listCompradorProductoAliasAdmin } from "../services/comprador-producto-alias.service";

interface CompradorAliasCreateModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
  onCreated: () => void;
}

import { formatCompradorLabel, isSamePrecio, matchesSearch, precioToTexto, type EquivalenciaCreateDraft } from "./comprador-alias-create-modal.helpers";
import { CompradorAliasCreateProductField } from "./comprador-alias-create-modal.product-field";
import { submitCompradorAliasCreates } from "./comprador-alias-create-modal.submit";

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
  const [precioEspecialPorProducto, setPrecioEspecialPorProducto] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [precioByProductoId, setPrecioByProductoId] = useState<
    Record<string, number>
  >({});
  const [drafts, setDrafts] = useState<Record<string, EquivalenciaCreateDraft>>({});
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [productoQuery, setProductoQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setProductoQuery("");
    setAliasByProductoId({});
    setPrecioEspecialPorProducto(new Set());
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
        const precioEspecialIds = new Set(
          nextAliases
            .filter((row) => row.precioOverride != null)
            .map((row) => row.idProducto),
        );

        setProductos(nextProductos);
        setPrecioByProductoId(nextPrecios);
        setAliasByProductoId(existingAlias);
        setPrecioEspecialPorProducto(precioEspecialIds);
        setDrafts(
          Object.fromEntries(
            nextProductos.map((row) => [
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
      const draft = drafts[row.idProducto];
      if (!draft) return false;
      const hasAlias = Boolean(draft.alias.trim());
      const precioChanged = !isSamePrecio(
        precioByProductoId[row.idProducto],
        draft.precioTexto,
      );
      return hasAlias || precioChanged;
    });
  }, [drafts, precioByProductoId, productos]);

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
    await submitCompradorAliasCreates({
      codigoCuenta,
      comprador,
      pendingCreates,
      drafts,
      precioByProductoId,
      precioEspecialPorProducto,
      onCreated,
      onClose,
      setError,
      setIsSubmitting,
    });
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
      closeOnBackdrop={pendingCreates.length === 0 && !isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <PolariaFormInput
        id="alias-comprador"
        label="Comprador"
        value={comprador ? formatCompradorLabel(comprador) : ""}
        readOnly
        disabled
        compact
      />

      <CompradorAliasCreateProductField
        isLoadingLists={isLoadingLists}
        isSubmitting={isSubmitting}
        productos={productos}
        productosFiltrados={productosFiltrados}
        productoQuery={productoQuery}
        onProductoQueryChange={setProductoQuery}
        drafts={drafts}
        precioByProductoId={precioByProductoId}
        onDraftChange={handleDraftChange}
      />
    </PolariaFormModal>
  );
}
