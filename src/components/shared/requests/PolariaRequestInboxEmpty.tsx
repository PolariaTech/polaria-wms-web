"use client";

import { cn } from "@/lib/utils/cn";

interface PolariaRequestInboxEmptyProps {
  message: string;
  className?: string;
}

export function PolariaRequestInboxEmpty({
  message,
  className,
}: PolariaRequestInboxEmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] items-center justify-center rounded-xl",
        "border border-polaria-w-08 bg-polaria-w-08 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="polaria-text-body-sm text-polaria-w-50">{message}</p>
    </div>
  );
}
