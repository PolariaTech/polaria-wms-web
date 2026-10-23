"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  PolariaFormField,
  POLARIA_FORM_INPUT_CLASS,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import {
  formatIsoToDdMmYyyy,
  parseDdMmYyyyToIso,
} from "@/lib/utils/fecha-dd-mm-yyyy";
import { cn } from "@/lib/utils/cn";

interface PolariaDateInputDdMmProps {
  id: string;
  label: string;
  /** Valor canónico `YYYY-MM-DD` (o vacío). */
  value: string;
  onChange: (isoDate: string) => void;
  hint?: string;
  compact?: boolean;
  required?: boolean;
  controlClassName?: string;
  disabled?: boolean;
}

/**
 * Fecha en pantalla como DD/MM/AAAA (REQ-090).
 * El valor del formulario sigue siendo ISO; el calendario nativo abre al tocar el icono.
 */
export function PolariaDateInputDdMm({
  id,
  label,
  value,
  onChange,
  hint,
  compact = false,
  required = false,
  controlClassName,
  disabled = false,
}: PolariaDateInputDdMmProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() =>
    value ? formatIsoToDdMmYyyy(value) : "",
  );

  useEffect(() => {
    setText(value ? formatIsoToDdMmYyyy(value) : "");
  }, [value]);

  const openNativePicker = () => {
    const el = nativeRef.current;
    if (!el || disabled) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      /* ignore */
    }
    el.click();
  };

  const commitText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      setText("");
      return;
    }
    const iso = parseDdMmYyyyToIso(trimmed);
    if (iso) {
      onChange(iso);
      setText(formatIsoToDdMmYyyy(iso));
      return;
    }
    setText(value ? formatIsoToDdMmYyyy(value) : "");
  };

  return (
    <PolariaFormField
      id={id}
      label={label}
      hint={hint}
      compact={compact}
      required={required}
    >
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/AAAA"
          disabled={disabled}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => commitText(text)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitText(text);
            }
          }}
          className={cn(
            compact ? POLARIA_FORM_INPUT_CLASS_COMPACT : POLARIA_FORM_INPUT_CLASS,
            "pr-10",
            controlClassName,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Abrir calendario"
          onClick={openNativePicker}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-polaria-w-50 hover:text-polaria-teal disabled:opacity-40"
        >
          <Calendar className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </button>
        <input
          ref={nativeRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          value={value || ""}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next);
            setText(next ? formatIsoToDdMmYyyy(next) : "");
          }}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>
    </PolariaFormField>
  );
}
