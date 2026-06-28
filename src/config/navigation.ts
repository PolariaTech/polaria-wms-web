import {
  BarChart3,
  ClipboardList,
  Home,
  Layers,
  Map,
  PackagePlus,
  Settings2,
  ShoppingCart,
  Truck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import {
  canAccessModule,
  hasPermission,
  type Permission,
  type WmsModule,
  WMS_MODULE,
} from "@/constants/permissions";
import {
  hasMinNivelRol,
  ROLES_INGRESO_BODEGA,
  ROLES_MAPA_BODEGA,
  ROLES_NIVEL_CUENTA,
  ROLES_TRANSPORTE,
  WmsRol,
} from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import type { AuthScope, NivelRol } from "@/types/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  scopes: readonly AuthScope[];
  permission?: Permission;
  module?: WmsModule;
  roles?: readonly string[];
  minNivelRol?: NivelRol;
}

export interface NavFilterContext {
  scope: AuthScope;
  idRol: string | null;
  nivelRol: NivelRol | null;
}

export const PLATFORM_NAV: readonly NavItem[] = [
  {
    href: ROUTES.configurator,
    label: "Panel",
    icon: Home,
    scopes: ["platform"],
  },
  {
    href: ROUTES.configuratorCreation,
    label: "Creación",
    icon: Layers,
    scopes: ["platform"],
  },
  {
    href: ROUTES.configuratorAssignment,
    label: "Asignación",
    icon: UserCheck,
    scopes: ["platform"],
  },
  {
    href: ROUTES.configuratorIntegration,
    label: "Integración",
    icon: ClipboardList,
    scopes: ["platform"],
  },
] as const;

export const TENANT_NAV: readonly NavItem[] = [
  {
    href: ROUTES.dashboard,
    label: "Inicio",
    icon: Home,
    scopes: ["tenant"],
  },
  {
    href: ROUTES.dashboardIngreso,
    label: "Ingreso",
    icon: PackagePlus,
    scopes: ["tenant"],
    roles: ROLES_INGRESO_BODEGA,
  },
  {
    href: ROUTES.dashboardCompras,
    label: "Compras",
    icon: ClipboardList,
    scopes: ["tenant"],
    module: WMS_MODULE.PURCHASES,
  },
  {
    href: ROUTES.dashboardMapa,
    label: "Mapa",
    icon: Map,
    scopes: ["tenant"],
    roles: ROLES_MAPA_BODEGA,
  },
  {
    href: ROUTES.dashboardProcesamiento,
    label: "Procesamiento",
    icon: Settings2,
    scopes: ["tenant"],
    module: WMS_MODULE.PROCESSING,
    roles: [
      WmsRol.procesador,
      ...ROLES_NIVEL_CUENTA,
      WmsRol.administrador_bodega,
      WmsRol.jefe_bodega,
    ],
  },
  {
    href: ROUTES.dashboardVentas,
    label: "Ventas",
    icon: ShoppingCart,
    scopes: ["tenant"],
    module: WMS_MODULE.SALES,
  },
  {
    href: ROUTES.dashboardTransporte,
    label: "Transporte",
    icon: Truck,
    scopes: ["tenant"],
    module: WMS_MODULE.TRANSPORT,
    roles: ROLES_TRANSPORTE,
  },
  {
    href: ROUTES.dashboardReporteria,
    label: "Reportería",
    icon: BarChart3,
    scopes: ["tenant"],
    module: WMS_MODULE.AUDIT,
  },
] as const;

export function getNavItemsForScope(scope: AuthScope): readonly NavItem[] {
  return scope === "platform" ? PLATFORM_NAV : TENANT_NAV;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard || href === ROUTES.configurator) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Filtra ítems de navegación según scope, permisos, rol y nivel jerárquico. */
export function filterNavItems(
  items: readonly NavItem[],
  context: NavFilterContext,
): NavItem[] {
  return items.filter((item) => matchesNavItem(item, context));
}

function matchesNavItem(item: NavItem, context: NavFilterContext): boolean {
  if (!item.scopes.includes(context.scope)) {
    return false;
  }

  if (!context.idRol || !context.nivelRol) {
    return false;
  }

  if (item.roles && !item.roles.includes(context.idRol)) {
    return false;
  }

  if (item.permission && !hasPermission(context.idRol, item.permission)) {
    return false;
  }

  if (item.module && !canAccessModule(context.idRol, context.nivelRol, item.module)) {
    return false;
  }

  if (item.minNivelRol && !hasMinNivelRol(context.nivelRol, item.minNivelRol)) {
    return false;
  }

  return true;
}
