"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { WmsRol } from "@/constants/roles";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth.store";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const OPERADOR_CUENTA_BREADCRUMBS: Readonly<
  Record<string, readonly BreadcrumbItem[]>
> = {
  [ROUTES.dashboardCompras]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Compras" },
  ],
  [ROUTES.dashboardProcesamiento]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Procesamiento" },
  ],
  [ROUTES.dashboardBodegaInternaCuenta]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Bodega interna" },
  ],
  [ROUTES.dashboardBodegaInternaCuentaProcesamiento]: [
    { label: "Inicio", href: ROUTES.dashboard },
    {
      label: "Bodega interna",
      href: ROUTES.dashboardBodegaInternaCuenta,
    },
    { label: "Procesamiento" },
  ],
  [ROUTES.dashboardVentas]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Ventas" },
  ],
  [ROUTES.dashboardVentasOrdenes]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Ventas", href: ROUTES.dashboardVentas },
    { label: "Órdenes venta" },
  ],
  [ROUTES.dashboardBodegaExternaCuenta]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Bodega externa" },
  ],
  [ROUTES.dashboardBodegaExternaCuentaIntegracion]: [
    { label: "Inicio", href: ROUTES.dashboard },
    { label: "Bodega externa", href: ROUTES.dashboardBodegaExternaCuenta },
    { label: "Integración" },
  ],
};

export function getOperadorCuentaBreadcrumbTrail(
  pathname: string,
): readonly BreadcrumbItem[] | null {
  if (pathname === ROUTES.dashboard) {
    return null;
  }

  return OPERADOR_CUENTA_BREADCRUMBS[pathname] ?? null;
}

export function OperadorCuentaBreadcrumb() {
  const pathname = usePathname();
  const idRol = useAuthStore((state) => state.session?.idRol);
  const trail =
    idRol === WmsRol.operador_cuenta
      ? getOperadorCuentaBreadcrumbTrail(pathname)
      : null;

  if (!trail) {
    return null;
  }

  return (
    <nav
      aria-label="Ruta operativa"
      className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6"
    >
      <ol className="polaria-text-body-sm flex flex-wrap items-center gap-2 text-polaria-w-50">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-polaria-w-20">
                  /
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "font-medium",
                    isLast ? "text-polaria-teal" : "text-polaria-w",
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition hover:text-polaria-teal"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** @deprecated Usar OperadorCuentaBreadcrumb */
export const DashboardBreadcrumb = OperadorCuentaBreadcrumb;
