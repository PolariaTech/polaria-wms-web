import type { TextareaHTMLAttributes } from "react";
import { PolariaFormField } from "@/components/shared/form/PolariaFormField";
import { POLARIA_FORM_INPUT_CLASS } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";

interface CatalogoFormCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CatalogoFormCheckbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: CatalogoFormCheckboxProps) {
  return (
    <PolariaFormField id={id} label={label} compact>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-polaria-teal"
        />
        <span className="polaria-text-body-sm text-polaria-w">Sí / online</span>
      </label>
    </PolariaFormField>
  );
}

interface CatalogoFormTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  id: string;
  label: string;
  hint?: string;
  fieldClassName?: string;
}

export function CatalogoFormTextarea({
  id,
  label,
  hint,
  fieldClassName,
  ...textareaProps
}: CatalogoFormTextareaProps) {
  return (
    <PolariaFormField
      id={id}
      label={label}
      hint={hint}
      className={fieldClassName}
      compact
    >
      <textarea
        id={id}
        className={cn(POLARIA_FORM_INPUT_CLASS, "min-h-[5rem] resize-y py-2 text-sm")}
        {...textareaProps}
      />
    </PolariaFormField>
  );
}
