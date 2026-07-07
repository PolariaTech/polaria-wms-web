"use client";

import type { BodegaReporteCategoriaMetric } from "../types/bodega-reportes.types";

interface BodegaReportesDonutChartProps {
  segments: BodegaReporteCategoriaMetric[];
}

const SEGMENT_COLORS = [
  "var(--teal)",
  "var(--danger)",
  "rgba(0, 85, 200, 0.85)",
  "var(--w50)",
  "rgba(248, 113, 113, 0.85)",
  "var(--warning)",
] as const;

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export function BodegaReportesDonutChart({
  segments,
}: BodegaReportesDonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.total, 0);
  const hasData = total > 0;

  let currentAngle = 0;
  const arcs = hasData
    ? segments.map((segment, index) => {
        const sweep = (segment.total / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sweep;
        currentAngle = endAngle;

        return {
          id: segment.id,
          path: describeArc(50, 50, 34, startAngle, endAngle),
          color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        };
      })
    : [];

  return (
    <section className="polaria-card-glow flex h-full flex-col rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="polaria-text-body-sm font-semibold text-polaria-w">
          Distribución
        </h2>
        <p className="mt-1 polaria-text-caption text-polaria-w-50">
          Solo categorías con al menos un registro
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <svg
          viewBox="0 0 100 100"
          className="h-40 w-40"
          role="img"
          aria-label="Gráfico de distribución por categoría"
        >
          {hasData ? (
            arcs.map((arc) => (
              <path
                key={arc.id}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth="10"
                strokeLinecap="butt"
              />
            ))
          ) : (
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="var(--t20)"
              strokeWidth="10"
            />
          )}
          <circle
            cx="50"
            cy="50"
            r="24"
            fill="var(--bg)"
          />
        </svg>

        {!hasData ? (
          <p className="text-center polaria-text-caption text-polaria-w-50">
            Sin datos para mostrar en la torta
          </p>
        ) : null}
      </div>
    </section>
  );
}
