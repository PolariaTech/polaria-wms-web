"use client";

import { PolariaFormField } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import {
  analyzePassword,
  normalizePasswordInput,
  PASSWORD_CHECK_LABELS,
  type PasswordCheckId,
  type PasswordStrengthScore,
} from "@/lib/utils/password-strength";

interface PolariaPasswordStrengthFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

const SCORE_BAR_CLASS: Record<PasswordStrengthScore, string> = {
  0: "w-0 bg-transparent",
  1: "w-1/4 bg-polaria-danger",
  2: "w-2/4 bg-amber-500",
  3: "w-3/4 bg-polaria-teal",
  4: "w-full bg-polaria-teal",
};

const SCORE_TEXT_CLASS: Record<PasswordStrengthScore, string> = {
  0: "text-polaria-w-50",
  1: "text-polaria-danger",
  2: "text-amber-400",
  3: "text-polaria-teal",
  4: "text-polaria-teal",
};

const CHECK_ORDER: PasswordCheckId[] = [
  "length",
  "upper",
  "lower",
  "number",
  "special",
  "common",
];

export function PolariaPasswordStrengthField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  compact = false,
  placeholder = "Contraseña inicial",
  autoComplete = "new-password",
}: PolariaPasswordStrengthFieldProps) {
  const analysis = analyzePassword(value);

  return (
    <PolariaFormField id={id} label={label} compact={compact}>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) =>
          onChange(normalizePasswordInput(event.target.value))
        }
        onBlur={() => onChange(normalizePasswordInput(value))}
        className={cn(
          "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4",
          compact ? "py-2.5" : "py-3",
          "text-polaria-w placeholder:text-polaria-w-20 outline-none",
          "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />

      <div className="mt-2 flex flex-col gap-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-polaria-w-08"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={analysis.score}
          aria-label={`Fortaleza de la contraseña: ${analysis.label}`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              SCORE_BAR_CLASS[analysis.score],
            )}
          />
        </div>

        <p
          className={cn(
            "polaria-text-caption",
            SCORE_TEXT_CLASS[analysis.score],
          )}
        >
          {value ? analysis.label : "Escribe una contraseña segura"}
        </p>

        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {CHECK_ORDER.map((checkId) => {
            const ok = analysis.checks[checkId];
            return (
              <li
                key={checkId}
                className={cn(
                  "flex items-start gap-2 polaria-text-caption",
                  ok ? "text-polaria-teal" : "text-polaria-w-50",
                )}
              >
                <span aria-hidden className="mt-0.5 shrink-0">
                  {ok ? "✓" : "○"}
                </span>
                <span>{PASSWORD_CHECK_LABELS[checkId]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </PolariaFormField>
  );
}
