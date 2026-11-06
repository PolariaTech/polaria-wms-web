"use client";

import {
  Camera,
  ClipboardList,
  Inbox,
  MailX,
  Minus,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { ROUTES } from "@/config/routes";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth.store";
import { VentasItemProximamente } from "./VentasItemProximamente";
import { VentasMenuImpresion } from "./VentasMenuImpresion";

/** Id del menú: lo usa el botón de la barra superior en `aria-controls`. */
export const VENTAS_MENU_ID = "ventas-menu";

interface EstadoMenuVentas {
  abierto: boolean;
  alternar: () => void;
}

/** Cerrado por defecto; el botón de la barra superior lo despliega y lo oculta. */
export const useVentasMenuStore = create<EstadoMenuVentas>((poner) => ({
  abierto: false,
  alternar: () => poner((actual) => ({ abierto: !actual.abierto })),
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

/** Solo los roles de nivel cuenta usan el menú de Ventas con correos. */
function useEsRolDeCuenta(): boolean {
  const idRol = useAuthStore((estado) => estado.session?.idRol);
  return !!idRol && (ROLES_NIVEL_CUENTA as readonly string[]).includes(idRol);
}

function EnlaceMenu({
  item,
  activo,
  className,
}: {
  item: ItemMenu;
  activo: boolean;
  className?: string;
}) {
  const Icono = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl border px-3 py-2.5 transition-colors",
        "polaria-text-body-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        activo
          ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
          : "border-transparent text-polaria-w-50 hover:bg-polaria-w-08 hover:text-polaria-w",
        className,
      )}
    >
      <Icono className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {item.label}
    </Link>
  );
}

/**
 * Menú de Ventas (REQ-104): órdenes y correos de pedidos. En pantalla ancha es una
 * columna fija a la izquierda; en pantalla angosta pasa a una tira horizontal arriba del
 * contenido para no quitarle ancho a la tabla. Se despliega y se oculta con el «+» del encabezado
 * de la página y, abierto, también con la «×» que queda a la altura de su primer enlace.
 */
export function VentasSidebar() {
  const pathname = usePathname();
  const esRolDeCuenta = useEsRolDeCuenta();
  const abierto = useVentasMenuStore((estado) => estado.abierto);

  if (!esRolDeCuenta) return null;

  return (
    <aside
      id={VENTAS_MENU_ID}
      className={cn(
        // Efecto cajón: el menú adentro ya mide su ancho final (w-60) y va pegado al borde DERECHO del
        // contenedor (`lg:justify-end`), con el recorte siempre activo. Al crecer el ancho, el menú
        // entra deslizándose con el borde: el botón queda siempre a la misma distancia de él, sin
        // asomar de golpe ni quedar «pegado» al borde mientras este frena.
        "shrink-0 border-polaria-w-08 transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex lg:justify-end lg:overflow-hidden",
        abierto
          ? "border-b lg:w-60 lg:border-b-0 lg:border-r"
          : "hidden lg:w-0 lg:border-r-0",
        "lg:sticky lg:top-[var(--polaria-shell-top)] lg:min-h-[calc(100dvh-var(--polaria-shell-top))] lg:self-start",
      )}
    >
      <nav
        aria-label="Menú de Ventas"
        inert={!abierto}
        className="polaria-scrollbar flex gap-2 overflow-x-auto px-4 py-3 lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-visible lg:px-3 lg:py-6"
      >
        {ITEMS.map((item, indice) => {
          const enlace = (
            <EnlaceMenu
              item={item}
              activo={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
              className={indice === 0 ? "lg:min-w-0 lg:flex-1 lg:shrink" : undefined}
            />
          );
          return (
            <div key={item.href} className="contents">
              {/* «Impresión en batch» es un desplegable con dos formas de imprimir; va tras las órdenes. */}
              {indice === 1 ? (
                <>
                  <VentasMenuImpresion pathname={pathname} />
                  {/* Estado de las fotos de captura por OV y OT: se define en un próximo paso. */}
                  <VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />
                </>
              ) : null}
              {item.separadorAntes ? (
                <span
                  role="separator"
                  aria-orientation="horizontal"
                  className="my-1 hidden h-px bg-polaria-w-08 lg:block"
                />
              ) : null}
              {indice === 0 ? (
                // Solo en la columna: la «×» va a la altura del primer enlace. En la tira de arriba
                // ya está el botón del encabezado, justo encima.
                <div className="contents lg:flex lg:items-center lg:gap-2">
                  {enlace}
                  <BotonAlternarMenu soloCierra className="hidden h-9 w-9 lg:inline-flex" />
                </div>
              ) : (
                enlace
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/**
 * El botón que despliega y oculta el menú de Ventas: el mismo en el encabezado de la página y en la
 * fila del primer enlace del propio menú. En el encabezado, cerrado muestra «+» (abre) y abierto «−» (cierra), así que el icono dice
 * el estado. Su etiqueta dice qué hará al pulsarlo y `aria-expanded` el estado.
 * No usa `polaria-topbar-btn`: esa clase fija el alto de la barra superior y le gana a las
 * utilidades de Tailwind.
 */
function BotonAlternarMenu({
  className,
  soloCierra = false,
  escalable = false,
}: {
  className?: string;
  /** Mide y se redondea en `em`: crece y baja con el tamaño del título que lo acompaña. */
  escalable?: boolean;
  /** El de la columna solo existe con el menú abierto: su icono es siempre la «×» de cerrar. */
  soloCierra?: boolean;
}) {
  const abierto = useVentasMenuStore((estado) => estado.abierto);
  const alternar = useVentasMenuStore((estado) => estado.alternar);
  const etiqueta = abierto ? "Ocultar menú de Ventas" : "Mostrar menú de Ventas";
  const Icono = soloCierra ? X : abierto ? Minus : Plus;
  return (
    <button
      type="button"
      onClick={alternar}
      aria-expanded={abierto}
      aria-controls={VENTAS_MENU_ID}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border",
        escalable ? "rounded-[0.2em]" : "rounded-xl",
        "border-polaria-w-08 bg-polaria-w-08 text-polaria-w transition-colors",
        "hover:border-polaria-t-20 hover:bg-polaria-t-08",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        className,
      )}
    >
      <Icono
        className={cn("shrink-0", escalable ? "h-[0.5em] w-[0.5em]" : "h-5 w-5")}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}

/**
 * Botón del encabezado de la página, a la izquierda del título. Mide 0,875 em de la tipografía
 * del título (unos 42 px con el título más grande) y se achica y crece con él. El área tocable llega a 44 px con un pseudo-elemento invisible. Se ve en
 * todos los anchos: cerrado, el menú no se muestra y este es el único
 * modo de abrirlo. Solo existe dentro de Ventas y para los roles de cuenta: en otra pantalla no
 * habría nada que desplegar.
 *
 * Convención de la interfaz: «+» abre y «−» cierra en el encabezado; dentro del menú la «×» cierra (igual que Cypher); el botón que queda más a la izquierda maneja el
 * panel de la izquierda y el más a la derecha, el de la derecha.
 */
export function BotonMenuVentas() {
  const pathname = usePathname();
  const esRolDeCuenta = useEsRolDeCuenta();
  const enVentas =
    pathname === ROUTES.dashboardVentas ||
    pathname.startsWith(`${ROUTES.dashboardVentas}/`);

  if (!esRolDeCuenta || !enVentas) return null;

  return (
    <BotonAlternarMenu
      escalable
      className={cn(
        "relative h-[0.875em] w-[0.875em] text-[length:clamp(1.875rem,4vw,3rem)] leading-none [@media(max-height:50rem)]:text-[length:1.75rem]",
        // Área tocable de 44 px sin agrandar el botón.
        "after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
      )}
    />
  );
}
