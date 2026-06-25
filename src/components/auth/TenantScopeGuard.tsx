"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/stores/auth.store";

interface TenantScopeGuardProps {
  children: React.ReactNode;
}

function isTenantSession(
  scope: "platform" | "tenant" | undefined,
  codigoEmpresa: string | null | undefined,
): boolean {
  return scope === "tenant" && Boolean(codigoEmpresa);
}

/** Restringe rutas operativas a usuarios tenant con empresa activa. */
export function TenantScopeGuard({ children }: TenantScopeGuardProps) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const context = useAuthStore((s) => s.context);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const scope = session?.scope ?? context?.scope;
  const codigoEmpresa = session?.codigoEmpresa ?? context?.codigoEmpresa;
  const allowed = isTenantSession(scope, codigoEmpresa);

  useEffect(() => {
    if (!isHydrated) return;
    if (scope === "platform") {
      router.replace(ROUTES.configurator);
      return;
    }
    if (!allowed) {
      router.replace(ROUTES.login);
    }
  }, [allowed, isHydrated, router, scope]);

  if (!isHydrated || scope === "platform" || !allowed) {
    return null;
  }

  return <>{children}</>;
}
