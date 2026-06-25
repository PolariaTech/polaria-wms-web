import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const INPUT_CLASS =
  "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 text-polaria-w placeholder:text-polaria-w-20 outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60";

interface PolariaFormFieldProps {
  id: string;
  label: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}

export function PolariaFormField({
  id,
  label,
  hint,
  children,
  className,
}: PolariaFormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="polaria-text-body-sm text-polaria-w">
        {label}
      </label>
      {children}
      {hint ? <p className="polaria-text-caption">{hint}</p> : null}
    </div>
  );
}

interface PolariaFormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  label: string;
  hint?: string;
  fieldClassName?: string;
}

export function PolariaFormInput({
  id,
  label,
  hint,
  fieldClassName,
  ...inputProps
}: PolariaFormInputProps) {
  return (
    <PolariaFormField id={id} label={label} hint={hint} className={fieldClassName}>
      <input id={id} className={INPUT_CLASS} {...inputProps} />
    </PolariaFormField>
  );
}

export { INPUT_CLASS as POLARIA_FORM_INPUT_CLASS };

interface PolariaFormSelectOption {
  value: string;
  label: string;
}

interface PolariaFormSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> {
  id: string;
  label: string;
  hint?: string;
  options: readonly PolariaFormSelectOption[];
  placeholder?: string;
  fieldClassName?: string;
}

export function PolariaFormSelect({
  id,
  label,
  hint,
  options,
  placeholder,
  fieldClassName,
  ...selectProps
}: PolariaFormSelectProps) {
  return (
    <PolariaFormField id={id} label={label} hint={hint} className={fieldClassName}>
      <select id={id} className={INPUT_CLASS} {...selectProps}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </PolariaFormField>
  );
}
