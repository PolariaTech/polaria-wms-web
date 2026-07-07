"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import {
  ADMIN_ASSIGNMENT_OPTIONS,
  ADMIN_CREATION_OPTIONS,
} from "@/modules/admin-panel/shared/constants/admin-assignment-creation-options";
import { ADMIN_PANEL_ACTIONS } from "@/modules/admin-panel/shared/constants/admin-panel-actions";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function findOptionLabel(pathname: string): string | null {
  const allOptions = [...ADMIN_CREATION_OPTIONS, ...ADMIN_ASSIGNMENT_OPTIONS];
  const match = allOptions.find((option) => option.href === pathname);
  return match?.title ?? null;
}

function getBreadcrumbTrail(pathname: string): BreadcrumbItem[] | null {
  if (pathname === ROUTES.dashboardAdminAssignmentCreation) {
    return [
      { label: "Inicio", href: ROUTES.dashboard },
      { label: "Asignación y creación" },
    ];
  }

  const optionLabel = findOptionLabel(pathname);
  if (optionLabel) {
    return [
      { label: "Inicio", href: ROUTES.dashboard },
      {
        label: "Asignación y creación",
        href: ROUTES.dashboardAdminAssignmentCreation,
      },
      { label: optionLabel },
    ];
  }

  if (pathname === ROUTES.dashboardCatalog) {
    return [
      { label: "Inicio", href: ROUTES.dashboard },
      { label: "Catálogo" },
    ];
  }

  const action = ADMIN_PANEL_ACTIONS.find((item) => item.href === pathname);
  if (action) {
    return [
      { label: "Inicio", href: ROUTES.dashboard },
      { label: action.title },
    ];
  }

  return null;
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const trail = getBreadcrumbTrail(pathname);

  if (!trail) {
    return null;
  }

  return (
    <nav
      aria-label="Ruta del panel administrativo"
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
