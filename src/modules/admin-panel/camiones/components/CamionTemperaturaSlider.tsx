"use client";

import { cn } from "@/lib/utils/cn";
import {
  CAMION_TEMP_PRESETS,
  TEMP_SLIDER_MAX,
  TEMP_SLIDER_MIN,
  clampTemp,
} from "../catalog/camion-tipo-temperatura";

interface CamionTemperaturaSliderProps {
  tempMin: number;
  tempMax: number;
  onChange: (next: { tempMin: number; tempMax: number }) => void;
  disabled?: boolean;
}

export function CamionTemperaturaSlider({
  tempMin,
  tempMax,
  onChange,
  disabled = false,
}: CamionTemperaturaSliderProps) {
  const low = Math.min(tempMin, tempMax);
  const high = Math.max(tempMin, tempMax);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-polaria-w-08 bg-polaria-t-08 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-polaria-w">Temperatura</p>
        <p className="font-mono text-xs text-polaria-teal">
          {low} °C → {high} °C
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CAMION_TEMP_PRESETS.map((preset) => {
          const active = low === preset.celsius && high === preset.celsius;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  tempMin: preset.celsius,
                  tempMax: preset.celsius,
                })
              }
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                active
                  ? "border-polaria-teal bg-polaria-teal text-polaria-bg"
                  : "border-polaria-t-20 bg-polaria-w-08 text-polaria-w-50 hover:border-polaria-teal hover:text-polaria-w",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {preset.label} ({preset.celsius}°)
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="polaria-text-caption text-polaria-w-50">
          Mínima ({TEMP_SLIDER_MIN}…{TEMP_SLIDER_MAX} °C)
        </span>
        <input
          type="range"
          min={TEMP_SLIDER_MIN}
          max={TEMP_SLIDER_MAX}
          step={1}
          value={tempMin}
          disabled={disabled}
          onChange={(event) => {
            const nextMin = clampTemp(Number(event.target.value));
            onChange({
              tempMin: nextMin,
              tempMax: Math.max(nextMin, tempMax),
            });
          }}
          className="camion-temp-slider w-full accent-[var(--teal)]"
          aria-label="Temperatura mínima"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="polaria-text-caption text-polaria-w-50">
          Máxima ({TEMP_SLIDER_MIN}…{TEMP_SLIDER_MAX} °C)
        </span>
        <input
          type="range"
          min={TEMP_SLIDER_MIN}
          max={TEMP_SLIDER_MAX}
          step={1}
          value={tempMax}
          disabled={disabled}
          onChange={(event) => {
            const nextMax = clampTemp(Number(event.target.value));
            onChange({
              tempMin: Math.min(tempMin, nextMax),
              tempMax: nextMax,
            });
          }}
          className="camion-temp-slider w-full accent-[var(--teal)]"
          aria-label="Temperatura máxima"
        />
      </label>
    </div>
  );
}
