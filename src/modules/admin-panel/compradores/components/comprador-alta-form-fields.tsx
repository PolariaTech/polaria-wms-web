"use client";

import { buildCompradorGrupoSelectOptions } from "../constants/comprador-grupos";
import type { CompradorAltaFormState } from "../utils/comprador-alta";
import {
  type CompradorAltaFormStep,
} from "./comprador-alta-form-shared";
import { CompradorAltaFormFiscalSection } from "./comprador-alta-form-fiscal-section";
import { CompradorAltaFormIdentificacionSection } from "./comprador-alta-form-identificacion-section";
import { CompradorAltaFormCondicionesSection } from "./comprador-alta-form-condiciones-section";
import { CompradorAltaFormCentrosSection } from "./comprador-alta-form-centros-section";
import { CompradorAltaFormContactosSection } from "./comprador-alta-form-contactos-section";
import { CompradorAltaFormCanalesSection } from "./comprador-alta-form-canales-section";
import { CompradorAltaFormReglasSection } from "./comprador-alta-form-reglas-section";

interface CompradorAltaFormFieldsProps {
  form: CompradorAltaFormState;
  onChange: (next: CompradorAltaFormState) => void;
  disabled?: boolean;
  idPrefix: string;
  codigoValue: string;
  nombreAutoFocus?: boolean;
  grupoOptions?: readonly string[];
  step?: CompradorAltaFormStep;
}

export function CompradorAltaFormFields({
  form,
  onChange,
  disabled,
  idPrefix,
  codigoValue,
  nombreAutoFocus,
  grupoOptions = [],
  step = "all",
}: CompradorAltaFormFieldsProps) {
  const bare = step !== "all";
  const show = (section: Exclude<CompradorAltaFormStep, "all">) =>
    step === "all" || step === section;
  const grupoSelectOptions = buildCompradorGrupoSelectOptions([
    ...grupoOptions,
    form.ficha.grupo,
  ]);

  return (
    <>
      <CompradorAltaFormFiscalSection
        show={show("fiscal")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
      <CompradorAltaFormIdentificacionSection
        show={show("identificacion")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
        codigoValue={codigoValue}
        nombreAutoFocus={nombreAutoFocus}
        grupoSelectOptions={grupoSelectOptions}
      />
      <CompradorAltaFormCondicionesSection
        show={show("condiciones")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
      <CompradorAltaFormCentrosSection
        show={show("centros")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
      <CompradorAltaFormContactosSection
        show={show("contactos")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
      <CompradorAltaFormCanalesSection
        show={show("canales")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
      <CompradorAltaFormReglasSection
        show={show("reglas")}
        bare={bare}
        form={form}
        onChange={onChange}
        disabled={disabled}
        idPrefix={idPrefix}
      />
    </>
  );
}
