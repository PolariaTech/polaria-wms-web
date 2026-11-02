"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

const CATALOG_STATUS_TONE_CLASS = {
  teal: "text-polaria-teal",
  warning: "text-polaria-warning",
  danger: "text-polaria-danger",
} as const;

/** Tooltip en portal fijo: no lo corta overflow de tablas/modales. */
export function CatalogStatusHint({
  label,
  tone,
  size = "sm",
  children,
}: {
  label: string;
  tone: keyof typeof CATALOG_STATUS_TONE_CLASS;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;
    const rect = trigger.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 6;
    const pad = 8;
    let top = rect.bottom + gap;
    if (top + tipRect.height > window.innerHeight - pad) {
      top = rect.top - tipRect.height - gap;
    }
    top = Math.max(pad, top);
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.min(
      Math.max(pad, left),
      window.innerWidth - tipRect.width - pad,
    );
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-label={label}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center outline-none",
          size === "md" ? "h-7 w-7" : null,
          CATALOG_STATUS_TONE_CLASS[tone],
        )}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open
        ? createPortal(
            <span
              ref={tipRef}
              role="tooltip"
              style={
                coords
                  ? { top: coords.top, left: coords.left }
                  : { top: 0, left: 0, visibility: "hidden" as const }
              }
              className="pointer-events-none fixed z-[300] w-max max-w-[16rem] rounded-lg border border-polaria-t-20 bg-polaria-bg px-2 py-1 text-center polaria-text-caption text-polaria-w shadow-lg"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
