import type { ChangeEventHandler } from "react";
import {
  PolariaFormField,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";

type NotasGeneralesPedidoFieldProps = {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  controlClassName?: string;
};

/** Notas de almacén: textarea tipo párrafo (REQ-215). */
export function NotasGeneralesPedidoField({
  id,
  value,
  onChange,
  controlClassName,
}: NotasGeneralesPedidoFieldProps) {
  return (
    <PolariaFormField
      id={id}
      label="Notas generales"
      compact
      className="sm:col-span-3"
    >
      <textarea
        id={id}
        value={value}
        placeholder="Notas generales para almacén"
        rows={4}
        onChange={onChange}
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "min-h-[6rem] resize-y leading-relaxed",
          controlClassName,
        )}
      />
    </PolariaFormField>
  );
}
