"use client";

import { Inbox, MailX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth.store";

interface ItemSidebar {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: readonly ItemSidebar[] = [
  {
    href: ROUTES.dashboardVentasCorreosMateo,
    label: "Correos recibidos",
    icon: Inbox,
  },
  {
    href: ROUTES.dashboardVentasCorreosDescartados,
    label: "Correos descartados",
    icon: MailX,
  },
];

/**
 * Navegación de las pantallas de correos de pedidos (REQ-104). En pantalla ancha es una
 * columna fija a la izquierda; en pantalla angosta pasa a una tira horizontal arriba del
 * contenido para no quitarle ancho a la tabla. Solo la ven los roles de nivel cuenta.
 */
export function VentasSidebar() {
  const pathname = usePathname();
  const idRol = useAuthStore((s) => s.session?.idRol);

  if (!idRol || !(ROLES_NIVEL_CUENTA as readonly string[]).includes(idRol)) {
    return null;
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-b border-polaria-w-08",
        "lg:sticky lg:top-[var(--polaria-shell-top)] lg:min-h-[calc(100dvh-var(--polaria-shell-top))] lg:w-60 lg:self-start lg:border-b-0 lg:border-r",
      )}
    >
      <nav
        aria-label="Correos de pedidos"
        className="polaria-scrollbar flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-visible lg:px-3 lg:py-6"
      >
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const activo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl border px-3 py-2.5 transition-colors",
                "polaria-text-body-sm font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                activo
                  ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
                  : "border-transparent text-polaria-w-50 hover:bg-polaria-w-08 hover:text-polaria-w",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
