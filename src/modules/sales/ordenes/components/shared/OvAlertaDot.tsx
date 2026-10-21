"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import type { OvAlertaStatus } from "../../../shared/utils/ov-sla";
import { slaDotTone, tooltipOvAlertaDot } from "../../../shared/utils/ov-sla";

const DOT_CLASS: Record<ReturnType<typeof slaDotTone>, string> = {
  atrasada: "bg-polaria-danger",
  en_riesgo: "bg-polaria-warning",
  cerrada: "bg-polaria-w-50",
  ok: "bg-polaria-teal",
};

const TIP_BORDER_CLASS: Record<ReturnType<typeof slaDotTone>, string> = {
  atrasada: "border-polaria-danger",
  en_riesgo: "border-polaria-warning",
  cerrada: "border-polaria-w-20",
  ok: "border-polaria-t-20",
};

export function OvAlertaDot({
  alertaStatus,
  minutosEnEstado,
  slaMinutos,
  alertaMinutos,
}: {
  alertaStatus: OvAlertaStatus;
  minutosEnEstado: number;
  slaMinutos: number;
  alertaMinutos: number;
}): ReactNode {
  const tone = slaDotTone(alertaStatus);
  const label = tooltipOvAlertaDot({
    alertaStatus,
    minutosEnEstado,
    slaMinutos,
    alertaMinutos,
  });
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
    let top = rect.top - tipRect.height - gap;
    if (top < pad) {
      top = rect.bottom + gap;
    }
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
        className="inline-flex h-3 w-3 shrink-0 cursor-default items-center justify-center outline-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span
          className={cn("h-2 w-2 rounded-full", DOT_CLASS[tone])}
          aria-hidden
        />
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
              className={cn(
                "pointer-events-none fixed z-[300] w-max max-w-[18rem] rounded-lg border bg-polaria-bg px-2.5 py-1.5 text-center polaria-text-caption text-polaria-w shadow-lg",
                TIP_BORDER_CLASS[tone],
              )}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
