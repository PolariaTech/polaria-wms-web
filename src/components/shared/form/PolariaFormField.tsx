import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const INPUT_CLASS =
  "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 text-polaria-w placeholder:text-polaria-w-20 outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60";

const INPUT_CLASS_COMPACT =
  "w-full rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 text-sm text-polaria-w placeholder:text-polaria-w-20 outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60";

const SELECT_CLASS =
  "polaria-form-select w-full cursor-pointer appearance-none rounded-xl border border-polaria-w-08 bg-polaria-w-08 bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-4 py-3 pr-10 text-polaria-w outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23f8f8f6%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]";

const SELECT_CLASS_COMPACT =
  "polaria-form-select w-full cursor-pointer appearance-none rounded-lg border border-polaria-w-08 bg-polaria-w-08 bg-[length:0.875rem] bg-[right_0.625rem_center] bg-no-repeat px-3 py-2 pr-9 text-sm text-polaria-w outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23f8f8f6%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]";

interface PolariaFormFieldProps {
  id: string;
  label: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function PolariaFormField({
  id,
  label,
  hint,
  children,
  className,
  compact = false,
}: PolariaFormFieldProps) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-2", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-polaria-w",
          compact ? "text-xs font-medium" : "polaria-text-body-sm",
        )}
      >
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
  compact?: boolean;
}

export function PolariaFormInput({
  id,
  label,
  hint,
  fieldClassName,
  compact = false,
  ...inputProps
}: PolariaFormInputProps) {
  return (
    <PolariaFormField
      id={id}
      label={label}
      hint={hint}
      className={fieldClassName}
      compact={compact}
    >
      <input
        id={id}
        className={compact ? INPUT_CLASS_COMPACT : INPUT_CLASS}
        {...inputProps}
      />
    </PolariaFormField>
  );
}

export { INPUT_CLASS as POLARIA_FORM_INPUT_CLASS };
export { SELECT_CLASS_COMPACT as POLARIA_FORM_SELECT_CLASS_COMPACT };

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
  compact?: boolean;
}

export function PolariaFormSelect({
  id,
  label,
  hint,
  options,
  placeholder,
  fieldClassName,
  compact = false,
  ...selectProps
}: PolariaFormSelectProps) {
  return (
    <PolariaFormField
      id={id}
      label={label}
      hint={hint}
      className={fieldClassName}
      compact={compact}
    >
      <select
        id={id}
        className={compact ? SELECT_CLASS_COMPACT : SELECT_CLASS}
        {...selectProps}
      >
        {placeholder ? (
          <option value="" disabled className="polaria-form-select__option">
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="polaria-form-select__option"
          >
            {option.label}
          </option>
        ))}
      </select>
    </PolariaFormField>
  );
}
