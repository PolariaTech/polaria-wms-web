"use client";

import {
  ClipboardList,
  Inbox,
  MailX,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { ROUTES } from "@/config/routes";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth.store";

/** Id del menú: lo usa el botón de la barra superior en `aria-controls`. */
export const VENTAS_MENU_ID = "ventas-menu";

interface VentasMenuState {
  abierto: boolean;
  alternar: () => void;
}

/** Abierto por defecto; el botón de la barra superior lo despliega y lo oculta. */
export const useVentasMenuStore = create<VentasMenuState>((set) => ({
  abierto: true,
  alternar: () => set((estado) => ({ abierto: !estado.abierto })),
}));

interface ItemMenu {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Línea fina encima: separa las órdenes de los correos. */
  separadorAntes?: boolean;
}

const ITEMS: readonly ItemMenu[] = [
  {
    href: ROUTES.dashboardVentasOrdenes,
    label: "Órdenes de venta",
    icon: ClipboardList,
  },
  {
    href: ROUTES.dashboardVentasCorreosMateo,
    label: "Correos recibidos",
    icon: Inbox,
    separadorAntes: true,
  },
  {
    href: ROUTES.dashboardVentasCorreosDescartados,
    label: "Correos descartados",
    icon: MailX,
  },
];

/**
 * Menú de Ventas (REQ-104): órdenes y correos de pedidos. En pantalla ancha es una
 * columna fija a la izquierda; en pantalla angosta pasa a una tira horizontal arriba del
 * contenido para no quitarle ancho a la tabla. Se despliega y se oculta con el botón de la
 * barra superior. Solo lo ven los roles de nivel cuenta.
 */
export function VentasSidebar() {
  const pathname = usePathname();
  const idRol = useAuthStore((s) => s.session?.idRol);
  const abierto = useVentasMenuStore((s) => s.abierto);

  if (!idRol || !(ROLES_NIVEL_CUENTA as readonly string[]).includes(idRol)) {
    return null;
  }

  return (
    <aside
      id={VENTAS_MENU_ID}
      className={cn(
        "shrink-0 border-polaria-w-08 transition-[width] duration-200 ease-out motion-reduce:transition-none",
        abierto
          ? "border-b lg:w-60 lg:border-b-0 lg:border-r"
          : "hidden lg:block lg:w-0 lg:overflow-hidden lg:border-r-0",
        "lg:sticky lg:top-[var(--polaria-shell-top)] lg:min-h-[calc(100dvh-var(--polaria-shell-top))] lg:self-start",
      )}
    >
      <nav
        aria-label="Menú de Ventas"
        inert={!abierto}
        className="polaria-scrollbar flex gap-2 overflow-x-auto px-4 py-3 lg:w-60 lg:flex-col lg:overflow-visible lg:px-3 lg:py-6"
      >
        {ITEMS.map(({ href, label, icon: Icon, separadorAntes }) => {
          const activo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <div key={href} className="contents">
              {separadorAntes ? (
                <span
                  role="separator"
                  aria-orientation="horizontal"
                  className="my-1 hidden h-px bg-polaria-w-08 lg:block"
                />
              ) : null}
              <Link
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
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
