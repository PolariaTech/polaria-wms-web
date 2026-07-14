"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import { getWidgetsForRole } from "../constants/dashboard-widgets";
import { fetchDashboardWidgetMetric } from "../../shared/services/dashboard-data";
import type {
  DashboardWidgetId,
  DashboardWidgetState,
} from "../../shared/types/dashboard.types";
import { DashboardWidget } from "../../home/components/DashboardWidget";

function metricStateFromCount(count: number): DashboardWidgetState {
  if (count === 0) {
    return {
      status: "empty",
      value: 0,
      message: "Sin registros por ahora.",
    };
  }

  return { status: "ready", value: count };
}

export function DashboardHome() {
  const { idRol, nivelRol } = usePermissions();
  const { codigoCuenta, activeBodegaId } = useCompany();
  const session = useAuthStore((s) => s.session);
  const widgets = useMemo(() => getWidgetsForRole(idRol), [idRol]);
  const [widgetStates, setWidgetStates] = useState<
    Partial<Record<DashboardWidgetId, DashboardWidgetState>>
  >({});

  useEffect(() => {
    let cancelled = false;

    const metricWidgets = widgets.filter((widget) => widget.kind === "metric");
    if (metricWidgets.length === 0) {
      return;
    }

    setWidgetStates((current) => {
      const next = { ...current };
      for (const widget of metricWidgets) {
        next[widget.id] = { status: "loading" };
      }
      return next;
    });

    void (async () => {
      const context = {
        codigoCuenta,
        idBodega: activeBodegaId,
        idUsuario: session?.idUsuario ?? null,
      };

      const results = await Promise.all(
        metricWidgets.map(async (widget) => {
          const result = await fetchDashboardWidgetMetric(widget.id, context);
          return { id: widget.id, result };
        }),
      );

      if (cancelled) return;

      setWidgetStates((current) => {
        const next = { ...current };
        for (const { id, result } of results) {
          if (!result.ok) {
            next[id] = { status: "error", message: result.message };
            continue;
          }
          next[id] = metricStateFromCount(result.count);
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [widgets, codigoCuenta, activeBodegaId, session?.idUsuario]);

  const actionWidgetStates = useMemo(() => {
    const next: Partial<Record<DashboardWidgetId, DashboardWidgetState>> = {};
    for (const widget of widgets) {
      if (widget.kind === "actions") {
        next[widget.id] = { status: "ready" };
      }
    }
    return next;
  }, [widgets]);

  const mergedStates = { ...actionWidgetStates, ...widgetStates };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="text-center sm:text-left">
        <h1 className="polaria-text-display">Dashboard</h1>
        <p className="polaria-text-subtitle mt-2">
          {session?.nombreRol ?? "Operación"} · nivel {nivelRol ?? "—"}
          {activeBodegaId ? ` · bodega ${activeBodegaId}` : null}
        </p>
      </header>

      {widgets.length === 0 ? (
        <p className="polaria-text-body-sm text-center text-polaria-w-50">
          No hay widgets configurados para tu rol.
        </p>
      ) : (
        <section
          aria-label="Widgets del dashboard"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {widgets.map((widget) => (
            <DashboardWidget
              key={widget.id}
              title={widget.title}
              description={widget.description}
              icon={widget.icon}
              href={widget.href}
              quickActions={widget.quickActions}
              state={
                mergedStates[widget.id] ?? {
                  status: widget.kind === "actions" ? "ready" : "loading",
                }
              }
            />
          ))}
        </section>
      )}
    </main>
  );
}
