"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DashboardWidgetState } from "../../shared/types/dashboard.types";
import type { DashboardQuickAction } from "../constants/dashboard-widgets";

interface DashboardWidgetProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  state: DashboardWidgetState;
  quickActions?: readonly DashboardQuickAction[];
}

export function DashboardWidget({
  title,
  description,
  icon: Icon,
  href,
  state,
  quickActions,
}: DashboardWidgetProps) {
  const body = (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 backdrop-blur-sm",
        href && "transition hover:border-polaria-teal hover:bg-polaria-t-20",
      )}
    >
    <div className="mb-4 flex items-start justify-between gap-3">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-polaria-w-08 bg-polaria-w-08",
        )}
      >
        <Icon className="h-5 w-5 text-polaria-teal" aria-hidden />
      </div>
      {state.status === "loading" ? (
        <Loader2
          className="h-4 w-4 animate-spin text-polaria-w-50"
          aria-label="Cargando"
        />
      ) : null}
    </div>

    <h2 className="polaria-text-card-title">{title}</h2>
    <p className="polaria-text-subtitle mt-2">{description}</p>

    <div className="mt-4 flex-1">
      {state.status === "ready" && state.value !== undefined ? (
        <p className="polaria-text-display text-polaria-teal">{state.value}</p>
      ) : null}

      {state.status === "empty" ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          {state.message ?? "Sin registros por ahora."}
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          {state.message ?? "No se pudieron cargar los datos."}
        </p>
      ) : null}

      {quickActions && quickActions.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {quickActions.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="polaria-text-body-sm inline-flex text-polaria-teal hover:underline"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal">
        {body}
      </Link>
    );
  }

  return body;
}
