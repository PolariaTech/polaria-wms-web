"use client";

import { cn } from "@/lib/utils/cn";

interface PolariaRequestInboxItemProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function PolariaRequestInboxItem({
  title,
  subtitle,
  onClick,
  className,
}: PolariaRequestInboxItemProps) {
  const content = (
    <>
      <p className="polaria-text-body-sm font-medium text-polaria-w">{title}</p>
      {subtitle ? (
        <p className="mt-1 polaria-text-caption text-polaria-w-50">{subtitle}</p>
      ) : null}
    </>
  );

  const boxClassName = cn(
    "rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-3 text-left",
    onClick &&
      "cursor-pointer transition hover:border-polaria-teal hover:bg-polaria-t-08",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(boxClassName, "w-full")}>
        {content}
      </button>
    );
  }

  return <article className={boxClassName}>{content}</article>;
}
