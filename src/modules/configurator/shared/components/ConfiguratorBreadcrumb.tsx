"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { CONFIGURATOR_ACTIONS } from "@/modules/configurator/shared/constants/configurator-actions";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function getBreadcrumbTrail(pathname: string): BreadcrumbItem[] | null {
  if (pathname === ROUTES.configurator) {
    return null;
  }

  if (pathname === ROUTES.configuratorCreation) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: "Creación" },
    ];
  }

  if (pathname === ROUTES.configuratorCreationAccounts) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: "Creación", href: ROUTES.configuratorCreation },
      { label: "Cuentas" },
    ];
  }

  if (pathname === ROUTES.configuratorCreationCompanies) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: "Creación", href: ROUTES.configuratorCreation },
      { label: "Empresas" },
    ];
  }

  if (pathname === ROUTES.configuratorCreationInternalWarehouse) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: "Creación", href: ROUTES.configuratorCreation },
      { label: "Bodega interna" },
    ];
  }

  if (pathname === ROUTES.configuratorCreationExternalWarehouse) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: "Creación", href: ROUTES.configuratorCreation },
      { label: "Bodega externa" },
    ];
  }

  if (pathname === ROUTES.configuratorAssignment) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: "Creación y asignación" },
    ];
  }

  if (pathname === ROUTES.configuratorAssignmentUsers) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      {
        label: "Creación y asignación",
        href: ROUTES.configuratorAssignment,
      },
      { label: "Usuarios" },
    ];
  }

  const action = CONFIGURATOR_ACTIONS.find((item) => item.href === pathname);
  if (action) {
    return [
      { label: "Inicio", href: ROUTES.configurator },
      { label: action.title },
    ];
  }

  return null;
}

export function ConfiguratorBreadcrumb() {
  const pathname = usePathname();
  const trail = getBreadcrumbTrail(pathname);

  if (!trail) {
    return null;
  }

  return (
    <nav
      aria-label="Ruta del configurador"
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
