"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";
import {
  resolveActiveBodegaId,
  writeStoredBodegaId,
} from "@/lib/utils/active-bodega";
import { useAuthStore } from "@/stores/auth.store";
import type { TenantContext } from "@/types/auth/auth";

export interface CompanyContextValue extends TenantContext {
  scope: "platform" | "tenant" | null;
  activeBodegaId: string | null;
  hasMultipleBodegas: boolean;
  setActiveBodegaId: (id: string) => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const context = useAuthStore((s) => s.context);
  const [preferredBodegaId, setPreferredBodegaId] = useState<string | null>(
    null,
  );

  const idBodegas = useMemo(
    () => session?.idBodegas ?? context?.idBodegas ?? [],
    [context?.idBodegas, session?.idBodegas],
  );
  const userId = session?.idUsuario;

  const activeBodegaId = useMemo(
    () => resolveActiveBodegaId(idBodegas, userId, preferredBodegaId),
    [idBodegas, preferredBodegaId, userId],
  );

  useEffect(() => {
    if (!userId || !activeBodegaId) return;
    writeStoredBodegaId(userId, activeBodegaId);
  }, [activeBodegaId, userId]);

  const setActiveBodegaId = useCallback(
    (id: string) => {
      if (!idBodegas.includes(id)) return;
      setPreferredBodegaId(id);
      if (userId) writeStoredBodegaId(userId, id);
    },
    [idBodegas, userId],
  );

  const value = useMemo((): CompanyContextValue => {
    const tenantSource = session ?? context;

    return {
      scope: tenantSource?.scope ?? null,
      codigoEmpresa: tenantSource?.codigoEmpresa ?? null,
      codigoCuenta: tenantSource?.codigoCuenta ?? null,
      idBodegas,
      nivelRol: tenantSource?.nivelRol ?? "platform",
      activeBodegaId,
      hasMultipleBodegas: idBodegas.length > 1,
      setActiveBodegaId,
    };
  }, [
    activeBodegaId,
    context,
    idBodegas,
    session,
    setActiveBodegaId,
  ]);

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const value = useContext(CompanyContext);
  if (!value) {
    throw new Error("useCompany debe usarse dentro de CompanyProvider.");
  }
  return value;
}

/** Selector visible solo cuando el usuario tiene más de una bodega activa. */
export function TenantBodegaSelector({ className }: { className?: string }) {
  const {
    idBodegas,
    activeBodegaId,
    hasMultipleBodegas,
    setActiveBodegaId,
  } = useCompany();

  if (!hasMultipleBodegas) return null;

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 text-sm text-polaria-w-50",
        className,
      )}
    >
      <span className="polaria-text-label">Bodega</span>
      <select
        value={activeBodegaId ?? ""}
        onChange={(event) => setActiveBodegaId(event.target.value)}
        aria-label="Seleccionar bodega activa"
        className="rounded-lg border border-polaria-t-20 bg-polaria-bg px-2 py-1.5 text-polaria-w"
      >
        {idBodegas.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Alias semántico del provider tenant. */
export const TenantProvider = CompanyProvider;
export const useTenant = useCompany;
