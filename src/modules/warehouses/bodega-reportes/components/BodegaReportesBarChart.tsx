"use client";

import { BarChart3 } from "lucide-react";
import type { BodegaReportesChartPoint } from "../types/bodega-reportes.types";

interface BodegaReportesBarChartProps {
  points: BodegaReportesChartPoint[];
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 16, bottom: 52, left: 40 };

function getYAxisMax(maxValue: number): number {
  if (maxValue <= 0) return 4;
  return Math.max(4, Math.ceil(maxValue / 4) * 4);
}

export function BodegaReportesBarChart({ points }: BodegaReportesBarChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const yMax = getYAxisMax(maxValue);
  const plotWidth =
    CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight =
    CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const barSlotWidth = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.min(56, barSlotWidth * 0.62);

  const yTicks = Array.from({ length: 5 }, (_, index) =>
    Math.round((yMax / 4) * index),
  );

  return (
    <section className="polaria-card-glow flex h-full flex-col rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-4 sm:p-5">
      <header className="mb-4 flex items-start gap-2">
        <BarChart3
          className="mt-0.5 h-4 w-4 shrink-0 text-polaria-teal"
          aria-hidden
        />
        <div>
          <h2 className="polaria-text-body-sm font-semibold text-polaria-w">
            Totales por tipo
          </h2>
          <p className="mt-1 polaria-text-caption text-polaria-w-50">
            Comparativa de registros en el historial
          </p>
        </div>
      </header>

      <div className="relative min-h-[220px] w-full flex-1">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-[220px] w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Gráfico de barras de totales por tipo"
        >
          {yTicks.map((tick) => {
            const y =
              CHART_PADDING.top +
              plotHeight -
              (tick / yMax) * plotHeight;

            return (
              <g key={tick}>
                <line
                  x1={CHART_PADDING.left}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="var(--w08)"
                  strokeWidth="1"
                />
                <text
                  x={CHART_PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--w50)"
                  fontSize="11"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <line
            x1={CHART_PADDING.left}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y1={CHART_PADDING.top + plotHeight}
            y2={CHART_PADDING.top + plotHeight}
            stroke="var(--t20)"
            strokeWidth="1"
          />

          {points.map((point, index) => {
            const slotCenter =
              CHART_PADDING.left +
              barSlotWidth * index +
              barSlotWidth / 2;
            const barHeight =
              yMax > 0 ? (point.value / yMax) * plotHeight : 0;
            const x = slotCenter - barWidth / 2;
            const y = CHART_PADDING.top + plotHeight - barHeight;

            return (
              <g key={point.id}>
                {barHeight > 0 ? (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill="var(--teal)"
                  />
                ) : (
                  <rect
                    x={x}
                    y={CHART_PADDING.top + plotHeight - 2}
                    width={barWidth}
                    height={2}
                    rx="1"
                    fill="var(--w08)"
                  />
                )}
                <text
                  x={slotCenter}
                  y={CHART_HEIGHT - 18}
                  textAnchor="middle"
                  fill="var(--w50)"
                  fontSize="11"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
