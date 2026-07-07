"use client";

import { cn } from "@/lib/utils/cn";
import {
  JEFE_BODEGA_ACTIONS,
  type JefeBodegaAction,
  type JefeBodegaActionId,
} from "../constants/jefe-bodega-actions";

interface JefeBodegaActionBarProps {
  className?: string;
  onActionClick?: (actionId: JefeBodegaActionId) => void;
}

function JefeBodegaActionButton({
  action,
  onActionClick,
}: {
  action: JefeBodegaAction;
  onActionClick?: (actionId: JefeBodegaActionId) => void;
}) {
  const Icon = action.icon;
  const isDisabled = action.disabled === true;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => {
        if (!isDisabled) {
          onActionClick?.(action.id);
        }
      }}
      className={cn(
        "group flex min-w-[9.5rem] flex-1 items-center gap-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-left",
        "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        isDisabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-polaria-teal hover:bg-polaria-t-20",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-w-08 bg-polaria-w-08",
          !isDisabled &&
            "transition group-hover:border-polaria-t-20 group-hover:bg-polaria-t-08",
        )}
      >
        <Icon
          className={cn(
            "h-[1.125rem] w-[1.125rem] text-polaria-w-50",
            !isDisabled && "transition group-hover:text-polaria-teal",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      </span>

      <span className="min-w-0">
        <span className="block polaria-text-body-sm font-semibold text-polaria-w">
          {action.title}
        </span>
        <span className="mt-0.5 block polaria-text-caption text-polaria-w-50">
          {action.subtitle}
        </span>
      </span>
    </button>
  );
}

export function JefeBodegaActionBar({
  className,
  onActionClick,
}: JefeBodegaActionBarProps) {
  return (
    <nav
      aria-label="Accesos jefe de bodega"
      className={cn("flex flex-wrap gap-3", className)}
    >
      {JEFE_BODEGA_ACTIONS.map((action) => (
        <JefeBodegaActionButton
          key={action.id}
          action={action}
          onActionClick={onActionClick}
        />
      ))}
    </nav>
  );
}
