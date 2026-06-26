"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, MessageCircle } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useLiveDate } from "@/hooks/useLiveDate";
import {
  getSessionDisplayName,
  getSessionInitial,
  getSessionRolNombre,
} from "@/lib/auth-session";
import { cn } from "@/lib/cn";
import { TenantBodegaSelector } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import type { TopbarUserInfo } from "@/types/layout";

interface AppTopbarProps {
  onMateoIaClick?: () => void;
  isMateoLoading?: boolean;
}

const ICON = "h-4 w-4 shrink-0";
const TOPBAR_SHAPE = "rounded-[0.625rem]";

function buildFallbackUser(): TopbarUserInfo {
  return {
    nombre: "Usuario",
    rol: "—",
    initial: "U",
  };
}

export function AppTopbar({
  onMateoIaClick,
  isMateoLoading = false,
}: AppTopbarProps) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const performLogout = useAuthStore((s) => s.performLogout);
  const { label: dateLabel, dateTime } = useLiveDate();

  const user = useMemo((): TopbarUserInfo => {
    if (!session) return buildFallbackUser();
    return {
      nombre: getSessionDisplayName(session),
      rol: getSessionRolNombre(session),
      initial: getSessionInitial(session),
    };
  }, [session]);

  const handleLogout = useCallback(async () => {
    await performLogout();
    router.replace(ROUTES.login);
  }, [performLogout, router]);

  const handleMateoIaClick = useCallback(() => {
    onMateoIaClick?.();
  }, [onMateoIaClick]);

  return (
    <header className="polaria-topbar w-full shrink-0">
      <div className="polaria-topbar__inner mx-auto max-w-[90rem] px-2 py-2 sm:px-6 sm:py-3 lg:px-8">
        <div className="polaria-topbar__grid">
          <div className="polaria-topbar__start">
            <div className="polaria-topbar__date">
              <span className="polaria-text-label">Fecha</span>
              <time dateTime={dateTime} className="polaria-text-body-sm mt-0.5">
                {dateLabel}
              </time>
            </div>

          </div>

          <div className="polaria-topbar__center">
            <Image
              src="/logo.png"
              alt="Polaria"
              width={120}
              height={32}
              priority
              className="polaria-topbar__logo"
            />
          </div>

          <div className="polaria-topbar__end">
            <TenantBodegaSelector className="hidden sm:inline-flex" />

            <button
              type="button"
              onClick={handleMateoIaClick}
              disabled={isMateoLoading}
              aria-label="Abrir Mateo IA"
              aria-busy={isMateoLoading}
              className={cn(
                "polaria-topbar-btn polaria-topbar-btn--teal polaria-topbar-btn--label-lg",
                TOPBAR_SHAPE,
                isMateoLoading && "cursor-wait opacity-80",
              )}
            >
              {isMateoLoading ? (
                <Loader2 className={cn(ICON, "animate-spin")} />
              ) : (
                <MessageCircle className={ICON} />
              )}
              <span className="polaria-topbar-btn__label">Mateo IA</span>
            </button>

            <div
              className={cn("polaria-topbar-user", TOPBAR_SHAPE)}
              aria-label={`Usuario: ${user.nombre}`}
              title={`${user.nombre} · ${user.rol}`}
            >
              <span className="polaria-topbar-user__avatar">{user.initial}</span>
              <span className="polaria-topbar-user__info">
                <span className="polaria-topbar-user__name" title={user.nombre}>
                  {user.nombre}
                </span>
                <span className="polaria-topbar-user__id" title={user.rol}>
                  {user.rol}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className={cn(
                "polaria-topbar-btn polaria-topbar-btn--danger polaria-topbar-btn--label-sm",
                TOPBAR_SHAPE,
              )}
            >
              <LogOut className={ICON} />
              <span className="polaria-topbar-btn__label">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      <div className="polaria-topbar-divider" aria-hidden />
    </header>
  );
}
