"use client";

import { useState } from "react";
import { ArrowRight, Building2, Loader2, Mail } from "lucide-react";
import type { TenantEmpresaOption } from "@/modules/auth/services/login-tenant-context.service";
import { cn } from "@/lib/cn";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

interface LoginStepUserProps {
  identificador: string;
  codigoEmpresa: string;
  empresaOptions: TenantEmpresaOption[];
  isLoading: boolean;
  error: string | null;
  onIdentificadorChange: (value: string) => void;
  onCodigoEmpresaChange: (value: string) => void;
  onSubmit: () => void;
}

export function LoginStepUser({
  identificador,
  codigoEmpresa,
  empresaOptions,
  isLoading,
  error,
  onIdentificadorChange,
  onCodigoEmpresaChange,
  onSubmit,
}: LoginStepUserProps) {
  const [formatError, setFormatError] = useState<string | null>(null);
  const showEmpresaSelector = empresaOptions.length > 1;

  const handleIdentificadorChange = (value: string) => {
    setFormatError(null);
    onIdentificadorChange(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(identificador)) {
      setFormatError("Ingresa un correo electrónico válido");
      return;
    }
    setFormatError(null);
    onSubmit();
  };

  const displayError = formatError ?? error;

  return (
    <div className="polaria-card-glow rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 backdrop-blur-xl sm:p-8">
      <p className="mb-6 text-center text-sm text-polaria-w-50">
        {showEmpresaSelector
          ? "Selecciona tu empresa para continuar"
          : "Ingresa tu correo electrónico para continuar"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="identificador"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-polaria-teal"
          >
            <Mail className="h-4 w-4" />
            Correo electrónico
          </label>
          <input
            id="identificador"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@empresa.com"
            value={identificador}
            onChange={(e) => handleIdentificadorChange(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 text-polaria-w placeholder:text-polaria-w-20 outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:opacity-60"
          />
        </div>

        {showEmpresaSelector && (
          <div>
            <label
              htmlFor="codigoEmpresa"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-polaria-teal"
            >
              <Building2 className="h-4 w-4" />
              Empresa
            </label>
            <select
              id="codigoEmpresa"
              value={codigoEmpresa}
              onChange={(e) => onCodigoEmpresaChange(e.target.value)}
              disabled={isLoading}
              className="polaria-form-select w-full cursor-pointer appearance-none rounded-xl border border-polaria-w-08 bg-polaria-w-08 bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-4 py-3 pr-10 text-polaria-w outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23f8f8f6%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]"
            >
              <option value="">Selecciona una empresa</option>
              {empresaOptions.map((empresa) => (
                <option key={empresa.codigoEmpresa} value={empresa.codigoEmpresa}>
                  {empresa.razonSocial}
                </option>
              ))}
            </select>
          </div>
        )}

        {displayError && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {displayError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !identificador.trim()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-3 text-sm font-semibold text-polaria-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
