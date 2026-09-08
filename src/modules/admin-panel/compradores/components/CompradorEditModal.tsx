"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  getCompradorAdmin,
  updateCompradorAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  listCompradorProductoAliasAdmin,
  updateCompradorProductoAliasAdmin,
  type CompradorProductoAliasListRow,
} from "../services/comprador-producto-alias.service";
import {
  altaFormStateFromDetalle,
  emptyAltaFormState,
  fichaFromAltaForm,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import { CompradorAliasCreateModal } from "./CompradorAliasCreateModal";
import { CompradorAltaFormFields } from "./CompradorAltaFormFields";
import {
  CompradorEquivalenciasTable,
  type CompradorEquivalenciaDraft,
} from "./CompradorEquivalenciasTable";
import { CompradorModalTabs } from "./CompradorModalTabs";

interface CompradorEditModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

type EditTab = "informacion" | "equivalencia";

const EDIT_TABS = [
  { id: "informacion" as const, label: "Editar información" },
  { id: "equivalencia" as const, label: "Equivalencia" },
];

function serializeForm(form: CompradorAltaFormState): string {
  return JSON.stringify(form);
}

function precioToTexto(precio: number | null): string {
  if (precio == null) return "";
  return String(precio);
}

function draftsFromRows(
  rows: CompradorProductoAliasListRow[],
): Record<string, CompradorEquivalenciaDraft> {
  return Object.fromEntries(
    rows.map((row) => [
      row.idAlias,
      {
        alias: row.alias,
        precioTexto: precioToTexto(row.precio),
      },
    ]),
  );
}

function isSamePrecio(
  original: number | null,
  precioTexto: string,
): boolean {
  const trimmed = precioTexto.trim();
  if (original == null) {
    return trimmed === "";
  }
  if (trimmed === "") return false;
  const parsed = parseDecimalEs(trimmed);
  if (parsed == null) return false;
  return Math.abs(parsed - original) < 1e-9;
}

export function CompradorEditModal({
  open,
  comprador,
  onClose,
  onUpdated,
}: CompradorEditModalProps) {
  const { codigoCuenta } = useCompany();
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
            : "No se pudo cargar la ficha del comprador.",
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

  const handleClose = useCallback(() => {
    if (isSubmitting || isEquivalenciaOpen) return;
    onClose();
  }, [isEquivalenciaOpen, isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comprador || !isDirty) return;

    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (isFormDirty) {
      const ficha = fichaFromAltaForm(form);
      const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
      if (!nombre) {
        setError("Falta el nombre comercial.");
        setActiveTab("informacion");
        return;
      }

      const telefonoPrincipal = form.telefono.trim();

      if (telefonoPrincipal && !isValidInternationalPhone(telefonoPrincipal)) {
        setError("Ingresa un número de teléfono válido.");
        setActiveTab("informacion");
        return;
      }
    }

    const equivalenciaChanges: Array<{
      row: CompradorProductoAliasListRow;
      draft: CompradorEquivalenciaDraft;
      aliasChanged: boolean;
      precioChanged: boolean;
      precioParsed: number | null;
    }> = [];

    for (const row of equivalencias) {
      const draft = equivalenciaDrafts[row.idAlias];
      if (!draft) continue;

      const aliasChanged = draft.alias.trim() !== row.alias.trim();
      const precioChanged = !isSamePrecio(row.precio, draft.precioTexto);

      if (!aliasChanged && !precioChanged) continue;

      if (aliasChanged && !draft.alias.trim()) {
        setError("La equivalencia no puede quedar vacía.");
        setActiveTab("equivalencia");
        return;
      }

      let precioParsed: number | null = null;
      if (precioChanged) {
        const trimmed = draft.precioTexto.trim();
        if (trimmed === "") {
          precioParsed = null;
        } else {
          precioParsed = parseDecimalEs(trimmed);
          if (precioParsed == null || precioParsed < 0) {
            setError("Ingresa un precio válido (0 o mayor).");
            setActiveTab("equivalencia");
            return;
          }
        }
      }

      equivalenciaChanges.push({
        row,
        draft,
        aliasChanged,
        precioChanged,
        precioParsed,
      });
    }

    setIsSubmitting(true);

    try {
      if (isFormDirty) {
        const ficha = fichaFromAltaForm(form);
        const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
        const telefonoPrincipal = form.telefono.trim();
        const telefonoContacto = ficha.contactos
          .map((row) => row.telefono.trim())
          .find((value) => value && isValidInternationalPhone(value));
        const telefonoGuardar = telefonoPrincipal || telefonoContacto || "";

        await updateCompradorAdmin({
          codigoCuenta,
          idComprador: comprador.idComprador,
          nombre,
          telefono: telefonoGuardar,
          ficha,
        });
      }

      for (const change of equivalenciaChanges) {
        let precioOverride: number | null | undefined;
        if (change.precioChanged) {
          if (
            change.precioParsed != null &&
            change.row.precioLista != null &&
            Math.abs(change.precioParsed - change.row.precioLista) < 1e-9
          ) {
            precioOverride = null;
          } else {
            precioOverride = change.precioParsed;
          }
        }

        await updateCompradorProductoAliasAdmin({
          codigoCuenta,
          idAlias: change.row.idAlias,
          ...(change.aliasChanged ? { alias: change.draft.alias } : {}),
          ...(change.precioChanged ? { precio: precioOverride ?? null } : {}),
        });
      }

      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el comprador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldsDisabled = isSubmitting || isLoading;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Editar comprador"
        title="Editar comprador"
        description="Actualiza la ficha o gestiona equivalencias de producto."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitDisabled={!isDirty || isLoading}
        submitLabel="Guardar"
        compact
        size="2xl"
        hideHeaderClose
        closeOnEscape={!isEquivalenciaOpen}
      >
        <CompradorModalTabs
          tabs={EDIT_TABS}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "informacion" ? (
          <CompradorAltaFormFields
            form={form}
            onChange={setForm}
            disabled={fieldsDisabled}
            idPrefix="edit-comprador"
            codigoValue={comprador?.codigo ?? ""}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="polaria-text-body-sm text-polaria-w-50">
              Edita solo equivalencia y precio de este comprador; el catálogo y la lista default no cambian.
            </p>

            {isLoading ? (
              <p className="polaria-text-body-sm text-polaria-w-50">
                Cargando…
              </p>
            ) : (
              <CompradorEquivalenciasTable
                rows={equivalencias}
                editable
                drafts={equivalenciaDrafts}
                disabled={fieldsDisabled}
                onDraftChange={handleDraftChange}
              />
            )}

            <button
              type="button"
              onClick={() => setIsEquivalenciaOpen(true)}
              disabled={fieldsDisabled}
              className="inline-flex w-fit items-center rounded-xl border border-polaria-t-20 px-4 py-2 polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
            >
              Crear equivalencia
            </button>
          </div>
        )}
      </PolariaFormModal>

      <CompradorAliasCreateModal
        open={isEquivalenciaOpen}
        comprador={comprador}
        onClose={() => setIsEquivalenciaOpen(false)}
        onCreated={() => {
          setIsEquivalenciaOpen(false);
          void loadEquivalencias();
          onUpdated();
        }}
      />
    </>
  );
}
