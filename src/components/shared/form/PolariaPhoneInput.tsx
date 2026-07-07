"use client";

import PhoneInput, { type Country } from "react-phone-number-input";
import es from "react-phone-number-input/locale/es.json";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_INPUT_COUNTRIES,
} from "@/constants/ui/phone-countries";
import { PolariaFormField } from "./PolariaFormField";

interface PolariaPhoneInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
  compact?: boolean;
  defaultCountry?: Country;
}

export function PolariaPhoneInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  hint,
  compact = false,
  defaultCountry = DEFAULT_PHONE_COUNTRY_CODE,
}: PolariaPhoneInputProps) {
  return (
    <PolariaFormField id={id} label={label} hint={hint} compact={compact}>
      <PhoneInput
        id={id}
        international
        defaultCountry={defaultCountry}
        countries={PHONE_INPUT_COUNTRIES as unknown as Country[]}
        labels={es}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        disabled={disabled}
        countryCallingCodeEditable={false}
        countrySelectProps={{
          className: cn("PhoneInputCountrySelect", "polaria-form-select"),
        }}
        className={cn(
          "polaria-phone-input",
          compact && "polaria-phone-input--compact",
        )}
        numberInputProps={{
          id,
          autoComplete: "tel",
          inputMode: "tel",
        }}
      />
    </PolariaFormField>
  );
}
