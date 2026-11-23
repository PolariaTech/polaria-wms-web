"use client";

import { type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import type { CompradorListRow } from "../services/compradores.service";
import { CompradorAliasCreateModal } from "./CompradorAliasCreateModal";
import { CompradorAltaFormFields } from "./CompradorAltaFormFields";
import { CompradorEquivalenciasTable } from "./CompradorEquivalenciasTable";
import { CompradorModalTabs } from "./CompradorModalTabs";
import { submitCompradorEditModal } from "./comprador-edit-modal.submit";
import { useCompradorEditModalState } from "./use-comprador-edit-modal-state";

interface CompradorEditModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
  onUpdated: () => void;
  grupoOptions?: readonly string[];
}

const EDIT_TABS = [
  { id: "informacion" as const, label: "Editar información" },
  { id: "equivalencia" as const, label: "Equivalencia" },
];

export function CompradorEditModal({
  open,
  comprador,
  onClose,
  onUpdated,
  grupoOptions = [],
}: CompradorEditModalProps) {
  const { codigoCuenta } = useCompany();
  const state = useCompradorEditModalState({
    open,
    comprador,
    codigoCuenta,
    grupoOptions,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitCompradorEditModal({
      codigoCuenta,
      comprador,
      isDirty: state.isDirty,
      isFormDirty: state.isFormDirty,
      form: state.form,
      equivalencias: state.equivalencias,
      equivalenciaDrafts: state.equivalenciaDrafts,
      setError: state.setError,
      setActiveTab: state.setActiveTab,
      setIsSubmitting: state.setIsSubmitting,
      onUpdated,
      onClose,
    });
  };

  const fieldsDisabled = state.isSubmitting || state.isLoading;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={() => state.handleClose(onClose)}
        sectionLabel="Editar cliente"
        title="Editar cliente"
        description="Actualiza la ficha o gestiona equivalencias de producto."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={state.error}
        isSubmitting={state.isSubmitting}
        submitDisabled={!state.isDirty || state.isLoading}
        submitLabel="Guardar"
        compact
        size="2xl"
        hideHeaderClose
        closeOnEscape={!state.isEquivalenciaOpen && !state.isSubmitting}
        closeOnBackdrop={
          !state.isDirty && !state.isSubmitting && !state.isEquivalenciaOpen
        }
      >
        <CompradorModalTabs
          tabs={EDIT_TABS}
          active={state.activeTab}
          onChange={state.setActiveTab}
        />

        {state.activeTab === "informacion" ? (
          <CompradorAltaFormFields
            form={state.form}
            onChange={state.setForm}
            disabled={fieldsDisabled}
            idPrefix="edit-comprador"
            codigoValue={comprador?.codigo ?? ""}
            grupoOptions={state.gruposLoaded}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="polaria-text-body-sm text-polaria-w-50">
              Edita solo equivalencia y precio de este comprador; el catálogo y la lista default no cambian.
            </p>

            {state.isLoading ? (
              <PolariaStatusLoading embedded className="py-4" />
            ) : (
              <CompradorEquivalenciasTable
                rows={state.equivalencias}
                editable
                drafts={state.equivalenciaDrafts}
                disabled={fieldsDisabled}
                onDraftChange={state.handleDraftChange}
              />
            )}

            <button
              type="button"
              onClick={() => state.setIsEquivalenciaOpen(true)}
              disabled={fieldsDisabled}
              className="inline-flex w-fit items-center rounded-xl border border-polaria-t-20 px-4 py-2 polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
            >
              Crear equivalencia
            </button>
          </div>
        )}
      </PolariaFormModal>

      <CompradorAliasCreateModal
        open={state.isEquivalenciaOpen}
        comprador={comprador}
        onClose={() => state.setIsEquivalenciaOpen(false)}
        onCreated={() => {
          state.setIsEquivalenciaOpen(false);
          void state.loadEquivalencias();
          onUpdated();
        }}
      />
    </>
  );
}