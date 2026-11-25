"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  getCompradorAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  listCompradorProductoAliasAdmin,
  type CompradorProductoAliasListRow,
} from "../services/comprador-producto-alias.service";
import { listGruposPertenecientesAdmin } from "../services/grupo-perteneciente.service";
import {
  altaFormStateFromDetalle,
  emptyAltaFormState,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import type { CompradorEquivalenciaDraft } from "./CompradorEquivalenciasTable";
import {
  draftsFromRows,
  isSamePrecio,
  serializeForm,
} from "./comprador-edit-modal.helpers";

export type EditTab = "informacion" | "equivalencia";

export function useCompradorEditModalState({
  open,
  comprador,
  codigoCuenta,
  grupoOptions,
}: {
  open: boolean;
  comprador: CompradorListRow | null;
  codigoCuenta: string | null;
  grupoOptions: readonly string[];
}) {
  const [form, setForm] = useState<CompradorAltaFormState>(emptyAltaFormState);
  const [initialSerialized, setInitialSerialized] = useState("");
  const [equivalencias, setEquivalencias] = useState<
    CompradorProductoAliasListRow[]
  >([]);
  const [equivalenciaDrafts, setEquivalenciaDrafts] = useState<
    Record<string, CompradorEquivalenciaDraft>
  >({});
  const [activeTab, setActiveTab] = useState<EditTab>("informacion");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEquivalenciaOpen, setIsEquivalenciaOpen] = useState(false);
  const [gruposLoaded, setGruposLoaded] = useState<string[]>([...grupoOptions]);
  const grupoOptionsKey = grupoOptions.join("|");

  const applyEquivalencias = useCallback(
    (rows: CompradorProductoAliasListRow[]) => {
      setEquivalencias(rows);
      setEquivalenciaDrafts(draftsFromRows(rows));
    },
    [],
  );

  const loadEquivalencias = useCallback(async () => {
    if (!codigoCuenta || !comprador) {
      applyEquivalencias([]);
      return;
    }
    const rows = await listCompradorProductoAliasAdmin({
      codigoCuenta,
      idComprador: comprador.idComprador,
    });
    applyEquivalencias(rows);
  }, [applyEquivalencias, codigoCuenta, comprador]);

  useEffect(() => {
    if (!open) return;

    if (grupoOptionsKey) {
      setGruposLoaded(grupoOptionsKey.split("|"));
      return;
    }

    setGruposLoaded([]);
    if (!codigoCuenta) return;

    let cancelled = false;
    void listGruposPertenecientesAdmin({ codigoCuenta })
      .then((rows) => {
        if (!cancelled) setGruposLoaded(rows);
      })
      .catch(() => {
        if (!cancelled) setGruposLoaded([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, codigoCuenta, grupoOptionsKey]);

  useEffect(() => {
    if (!open || !comprador) return;

    setForm({
      ...emptyAltaFormState(),
      nombreComercial: comprador.comprador,
      telefono: comprador.telefono ?? "",
    });
    setInitialSerialized("");
    applyEquivalencias([]);
    setActiveTab("informacion");
    setError(null);
    setIsSubmitting(false);
    setIsEquivalenciaOpen(false);

    if (!codigoCuenta) return;

    let cancelled = false;
    setIsLoading(true);

    void Promise.all([
      getCompradorAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
      }),
      listCompradorProductoAliasAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
      }),
    ])
      .then(([detalle, nextEquivalencias]) => {
        if (cancelled) return;
        const nextForm = altaFormStateFromDetalle(
          detalle.comprador,
          detalle.telefono ?? "",
          detalle.ficha,
        );
        setForm(nextForm);
        setInitialSerialized(serializeForm(nextForm));
        applyEquivalencias(nextEquivalencias);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo cargar la ficha del cliente.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyEquivalencias, codigoCuenta, comprador, open]);

  const isFormDirty = useMemo(() => {
    if (!initialSerialized) return false;
    return serializeForm(form) !== initialSerialized;
  }, [form, initialSerialized]);

  const isEquivalenciasDirty = useMemo(() => {
    return equivalencias.some((row) => {
      const draft = equivalenciaDrafts[row.idAlias];
      if (!draft) return false;
      const aliasChanged = draft.alias.trim() !== row.alias.trim();
      const precioChanged = !isSamePrecio(row.precio, draft.precioTexto);
      return aliasChanged || precioChanged;
    });
  }, [equivalenciaDrafts, equivalencias]);

  const isDirty = isFormDirty || isEquivalenciasDirty;

  const handleDraftChange = useCallback(
    (idAlias: string, patch: Partial<CompradorEquivalenciaDraft>) => {
      setEquivalenciaDrafts((prev) => {
        const current = prev[idAlias] ?? { alias: "", precioTexto: "" };
        return {
          ...prev,
          [idAlias]: { ...current, ...patch },
        };
      });
    },
    [],
  );

  const handleClose = useCallback(
    (onClose: () => void) => {
      if (isSubmitting || isEquivalenciaOpen) return;
      onClose();
    },
    [isEquivalenciaOpen, isSubmitting],
  );

  return {
    form,
    setForm,
    equivalencias,
    equivalenciaDrafts,
    activeTab,
    setActiveTab,
    error,
    setError,
    isLoading,
    isSubmitting,
    setIsSubmitting,
    isEquivalenciaOpen,
    setIsEquivalenciaOpen,
    gruposLoaded,
    isFormDirty,
    isDirty,
    handleDraftChange,
    handleClose,
    loadEquivalencias,
  };
}