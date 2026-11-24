"use client";

import { PolariaFormField, PolariaFormInput, PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import { type CompradorAltaFormState } from "../utils/comprador-alta";
import { REGIMEN_OPTIONS, USO_CFDI_OPTIONS } from "./comprador-alta-form-options";
import { StepShell, patchFicha } from "./comprador-alta-form-shared";

export type CompradorAltaSectionProps = {
  show: boolean;
  bare: boolean;
  form: CompradorAltaFormState;
  onChange: (next: CompradorAltaFormState) => void;
  disabled?: boolean;
  idPrefix: string;
  codigoValue?: string;
  nombreAutoFocus?: boolean;
  grupoSelectOptions?: { value: string; label: string }[];
};

export function CompradorAltaFormFiscalSection(props: CompradorAltaSectionProps) {
  const { show, bare, form, onChange, disabled, idPrefix } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Datos fiscales"
            optional="Se copian de la Constancia de Situación Fiscal"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PolariaFormInput
                id={`${idPrefix}-razon`}
                label="Razón social"
                value={ficha.razonSocial}
                placeholder="Tal cual aparece en la constancia"
                onChange={(event) =>
                  patchFicha(form, onChange, { razonSocial: event.target.value })
                }
                disabled={disabled}
                compact
                fieldClassName="sm:col-span-2"
              />
              <PolariaFormInput
                id={`${idPrefix}-rfc`}
                label="RFC"
                value={ficha.rfc}
                maxLength={13}
                onChange={(event) =>
                  patchFicha(form, onChange, { rfc: event.target.value.toUpperCase() })
                }
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-regimen`}
                label="Régimen fiscal"
                value={ficha.regimen}
                onChange={(event) =>
                  patchFicha(form, onChange, { regimen: event.target.value })
                }
                options={REGIMEN_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-cp-fiscal`}
                label="CP del domicilio fiscal"
                value={ficha.cpFiscal}
                maxLength={5}
                onChange={(event) =>
                  patchFicha(form, onChange, { cpFiscal: event.target.value })
                }
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-uso-cfdi`}
                label="Uso del CFDI por omisión"
                value={ficha.usoCfdi}
                onChange={(event) =>
                  patchFicha(form, onChange, { usoCfdi: event.target.value })
                }
                options={USO_CFDI_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormField
                id={`${idPrefix}-csf`}
                label="Constancia de Situación Fiscal"
                compact
                className="sm:col-span-2"
              >
                <label
                  htmlFor={`${idPrefix}-csf`}
                  className={cn(
                    "block cursor-pointer rounded-xl border border-dashed border-polaria-t-20 bg-polaria-w-08 px-4 py-3 text-center",
                    "polaria-text-body-sm text-polaria-w-50 transition hover:border-polaria-teal hover:text-polaria-teal",
                  )}
                >
                  Adjuntar PDF de la constancia
                  <input
                    id={`${idPrefix}-csf`}
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={disabled}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      patchFicha(form, onChange, { constanciaNombre: file?.name ?? "" });
                    }}
                  />
                </label>
                {ficha.constanciaNombre ? (
                  <p className="mt-2 font-mono polaria-text-caption text-polaria-w">
                    {ficha.constanciaNombre}
                  </p>
                ) : null}
              </PolariaFormField>
              <PolariaFormInput
                id={`${idPrefix}-csf-fecha`}
                label="Fecha de la constancia"
                type="date"
                value={ficha.constanciaFecha}
                onChange={(event) =>
                  patchFicha(form, onChange, { constanciaFecha: event.target.value })
                }
                disabled={disabled}
                compact
              />
            </div>
          </StepShell>
  );
}
