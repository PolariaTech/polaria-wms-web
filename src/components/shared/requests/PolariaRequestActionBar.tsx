"use client";

import { cn } from "@/lib/utils/cn";
import type { PolariaRequestActionBarProps } from "./polaria-request.types";

const ACTION_TONE: Record<
  NonNullable<PolariaRequestActionBarProps["actions"][number]["tone"]>,
  string
> = {
  teal: "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal hover:border-polaria-teal",
  warning:
    "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning hover:border-polaria-warning",
  neutral:
    "border-polaria-w-08 bg-polaria-w-08 text-polaria-w hover:border-polaria-t-20 hover:text-polaria-teal",
};

export function PolariaRequestActionBar({
  actions,
  className,
}: PolariaRequestActionBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2",
        className,
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const tone = ACTION_TONE[action.tone ?? "neutral"];

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3",
              "polaria-text-body-sm font-medium transition",
              "disabled:cursor-not-allowed disabled:opacity-60",
              tone,
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
