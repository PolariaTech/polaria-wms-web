"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { CONFIGURATOR_ACTIONS } from "../constants/configurator-actions";
import { cn } from "@/lib/cn";

function getBreadcrumbTitle(pathname: string): string | null {
  if (pathname === ROUTES.configurator) {
    return null;
  }

  const action = CONFIGURATOR_ACTIONS.find((item) => item.href === pathname);
  return action?.title ?? null;
}

export function ConfiguratorBreadcrumb() {
  const pathname = usePathname();
  const currentTitle = getBreadcrumbTitle(pathname);

  if (!currentTitle) {
    return null;
  }

  return (
    <nav
      aria-label="Ruta del configurador"
      className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6"
    >
      <ol className="polaria-text-body-sm flex flex-wrap items-center gap-2 text-polaria-w-50">
        <li>
          <Link
            href={ROUTES.configurator}
            className="transition hover:text-polaria-teal"
          >
            Configurador
          </Link>
        </li>
        <li aria-hidden className="text-polaria-w-20">
          /
        </li>
        <li>
          <span
            aria-current="page"
            className={cn("font-medium text-polaria-w")}
          >
            {currentTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}
