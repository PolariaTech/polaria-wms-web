"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CustodioRefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isRefreshing?: boolean;
}

export function CustodioRefreshButton({
  onClick,
  disabled = false,
  isRefreshing = false,
}: CustodioRefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isRefreshing}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl",
        "border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
        "polaria-text-body-sm font-medium text-polaria-w",
        "transition hover:border-polaria-teal hover:text-polaria-teal",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <RefreshCw
        className={cn("h-4 w-4", isRefreshing && "animate-spin")}
        aria-hidden
      />
      Actualizar
    </button>
  );
}
