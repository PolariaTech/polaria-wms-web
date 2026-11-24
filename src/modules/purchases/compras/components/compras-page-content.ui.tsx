import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function TableCellText({
  text,
  title,
  className,
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(className)}
      title={title ?? (text !== "—" ? text : undefined)}
    >
      {text}
    </span>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-polaria-teal text-polaria-on-teal"
          : "border border-polaria-t-20 text-polaria-w-50 hover:bg-polaria-t-08",
      )}
    >
      {children}
    </button>
  );
}

export function ActionButton({
  label,
  onClick,
  disabled,
  primary = false,
  title,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex min-w-[7rem] items-center justify-center rounded-xl px-4 py-2.5 polaria-text-body-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        primary
          ? "bg-polaria-teal text-polaria-on-teal hover:opacity-90"
          : "border border-polaria-teal text-polaria-teal hover:bg-polaria-t-08",
      )}
    >
      {label}
    </button>
  );
}