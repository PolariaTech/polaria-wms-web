import type { ChangeEventHandler, ReactNode } from "react";
import {
  PolariaFormField,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";

type DireccionEntregaFieldProps = {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  controlClassName?: string;
  footer?: ReactNode;
};

/** Dirección de entrega a ancho completo, textarea (REQ-217). */
export function DireccionEntregaField({
  id,
  value,
  onChange,
  controlClassName,
  footer,
}: DireccionEntregaFieldProps) {
  return (
    <div className="sm:col-span-3">
      <PolariaFormField id={id} label="Dirección de entrega" compact>
        <textarea
          id={id}
          value={value}
          rows={3}
          onChange={onChange}
          className={cn(
            POLARIA_FORM_INPUT_CLASS_COMPACT,
            "min-h-[4.5rem] resize-y leading-relaxed",
            controlClassName,
          )}
        />
      </PolariaFormField>
      {footer}
    </div>
  );
}
