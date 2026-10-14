"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserPreview } from "@/types/auth/auth";

interface LoginStepPasswordProps {
  userPreview: UserPreview;
  password: string;
  isLoading: boolean;
  error: string | null;
  onPasswordChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function getInitial(nombre: string): string {
  return nombre.charAt(0).toUpperCase();
}

export function LoginStepPassword({
  userPreview,
  password,
  isLoading,
  error,
  onPasswordChange,
  onBack,
  onSubmit,
}: LoginStepPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="polaria-card-glow rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-polaria-t-08 text-sm font-bold text-polaria-teal">
          {getInitial(userPreview.nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-polaria-w">{userPreview.nombre}</p>
          {userPreview.empresa ? (
            <p className="truncate text-sm text-polaria-w-50">
              Empresa:{" "}
              <span className="text-polaria-teal">
                {userPreview.empresa.nombre || userPreview.empresa.codigo}
              </span>
            </p>
          ) : (
            <p className="truncate text-sm text-polaria-w-50">
              {userPreview.identificador}
            </p>
          )}
        </div>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-polaria-teal" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-polaria-teal"
          >
            <Lock className="h-4 w-4" />
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-3 pr-12 pl-4 text-polaria-w placeholder:text-polaria-w-20 outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={isLoading}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-polaria-w-50 transition hover:bg-polaria-t-08 hover:text-polaria-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 text-sm font-medium text-polaria-w transition hover:bg-polaria-t-08 disabled:opacity-60"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={isLoading || !password}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-3 text-sm font-semibold text-polaria-on-teal transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Iniciar sesión
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
