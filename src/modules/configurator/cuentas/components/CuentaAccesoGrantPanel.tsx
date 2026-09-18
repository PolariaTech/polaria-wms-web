"use client";

import type { LucideIcon } from "lucide-react";
import { Power, Sparkles, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CuentaAccesoGrantPanelProps {
  estaActiva: boolean;
  accesoWms: boolean;
  accesoMateo: boolean;
  disabled?: boolean;
  showProductos?: boolean;
  showLogin?: boolean;
  ariaLabel?: string;
  loginOnCaption?: string;
  loginOffCaption?: string;
  onToggleActiva?: () => void;
  onToggleWms?: () => void;
  onToggleMateo?: () => void;
}

function GrantSwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-polaria-teal" : "bg-polaria-w-08",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition",
          on ? "translate-x-5 bg-polaria-bg" : "bg-polaria-w-50",
        )}
      />
    </span>
  );
}

function ProductGrantCard({
  granted,
  disabled,
  locked,
  icon: Icon,
  title,
  description,
  onToggle,
}: {
  granted: boolean;
  disabled?: boolean;
  locked: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={granted}
      aria-disabled={disabled || locked}
      disabled={disabled}
      onClick={() => {
        if (locked) return;
        onToggle();
      }}
      className={cn(
        "flex min-h-[10.5rem] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        granted
          ? "border-polaria-teal bg-polaria-t-08 shadow-[0_0_24px_var(--teal-glow)]"
          : "border-polaria-t-20 bg-polaria-bg/40",
        disabled
          ? "cursor-not-allowed opacity-50"
          : locked
            ? "cursor-not-allowed"
            : "hover:border-polaria-teal",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border",
          granted
            ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
            : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="polaria-text-body-sm font-semibold text-polaria-w">
        {title}
      </span>
      <span className="polaria-text-caption text-polaria-w-50">
        {description}
      </span>
      <span
        className={cn(
          "polaria-text-badge mt-1",
          granted ? "text-polaria-teal" : "text-polaria-w-20",
        )}
      >
        {granted ? "Concedido" : "Sin acceso"}
      </span>
    </button>
  );
}

export function CuentaAccesoGrantPanel({
  estaActiva,
  accesoWms,
  accesoMateo,
  disabled = false,
  showProductos = true,
  showLogin = true,
  ariaLabel = "Accesos",
  loginOnCaption = "Puede iniciar sesión.",
  loginOffCaption = "No puede iniciar sesión.",
  onToggleActiva,
  onToggleWms,
  onToggleMateo,
}: CuentaAccesoGrantPanelProps) {
  return (
    <section className="flex flex-col gap-3" aria-label={ariaLabel}>
      <p className="polaria-text-label text-polaria-w-50">Accesos</p>

      {showLogin ? (
      <button
        type="button"
        role="switch"
        aria-checked={estaActiva}
        disabled={disabled}
        onClick={() => onToggleActiva?.()}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          estaActiva
            ? "border-polaria-t-20 bg-polaria-t-08"
            : "border-polaria-t-20 bg-polaria-bg/40",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:border-polaria-teal",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            estaActiva
              ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
              : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50",
          )}
        >
          <Power className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block polaria-text-body-sm font-semibold text-polaria-w">
            Inicio de sesión
          </span>
          <span className="mt-0.5 block polaria-text-caption text-polaria-w-50">
            {estaActiva ? loginOnCaption : loginOffCaption}
          </span>
        </span>
        <span
          className={cn(
            "hidden polaria-text-badge sm:inline",
            estaActiva ? "text-polaria-teal" : "text-polaria-w-20",
          )}
        >
          {estaActiva ? "Concedido" : "Revocado"}
        </span>
        <GrantSwitchTrack on={estaActiva} />
      </button>
      ) : null}

      {showProductos ? (
        <>
          <p className="polaria-text-label text-polaria-w-50">Productos</p>

          <div className="grid grid-cols-2 gap-3">
            <ProductGrantCard
              granted={accesoWms}
              disabled={disabled}
              locked={accesoWms && !accesoMateo}
              icon={Warehouse}
              title="Polaria WMS"
              description="Bodega, pedidos y operación"
              onToggle={() => onToggleWms?.()}
            />
            <ProductGrantCard
              granted={accesoMateo}
              disabled={disabled}
              locked={accesoMateo && !accesoWms}
              icon={Sparkles}
              title="Mateo IA"
              description="Asistente en el topbar"
              onToggle={() => onToggleMateo?.()}
            />
          </div>

          <p className="polaria-text-caption text-polaria-w-50">
            Concede uno o ambos. El último producto no se puede quitar.
          </p>
        </>
      ) : null}
    </section>
  );
}
