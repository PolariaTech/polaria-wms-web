"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PolariaTablePaginationFooterProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PolariaTablePaginationFooter({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: PolariaTablePaginationFooterProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-polaria-w-08 px-5 py-3 sm:px-6",
        className,
      )}
    >
      <p className="polaria-text-caption text-polaria-w-50">
        Mostrando {from}–{to} de {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <span className="polaria-text-caption text-polaria-w-50">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
            "hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
            "hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </footer>
  );
}
