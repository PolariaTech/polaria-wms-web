"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/stores/auth.store";

interface PlatformScopeGuardProps {
  children: React.ReactNode;
}

/** Restringe el dominio configurador a usuarios con scope platform. */
export function PlatformScopeGuard({ children }: PlatformScopeGuardProps) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const context = useAuthStore((s) => s.context);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const scope = session?.scope ?? context?.scope;

  useEffect(() => {
    if (!isHydrated) return;
    if (scope === "tenant") {
      router.replace(ROUTES.dashboard);
    }
  }, [isHydrated, router, scope]);

  if (!isHydrated || scope === "tenant") {
    return null;
  }

  return <>{children}</>;
}
