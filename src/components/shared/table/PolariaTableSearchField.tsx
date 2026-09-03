"use client";

import { Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface PolariaTableSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PolariaTableSearchField({
  value,
  onChange,
  placeholder = "Buscar…",
  disabled = false,
}: PolariaTableSearchFieldProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className={cn(
          "min-w-[12rem] rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2 pl-10 pr-3",
          "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
          "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
    </div>
  );
}
