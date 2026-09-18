import {
  BarChart3,
  Building2,
  ClipboardList,
  Factory,
  LayoutGrid,
  Package,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import type { LucideIcon } from "lucide-react";

export type CuentaCockpitModuloId =
  | "acceso"
  | "usuarios"
  | "bodegas"
  | "catalogo"
  | "lista-precio"
  | "proveedores"
  | "clientes"
  | "compradores"
  | "camiones"
  | "plantas"
  | "compras"
  | "ventas"
  | "transporte"
  | "reportes";

export interface CuentaCockpitOption {
  id: CuentaCockpitModuloId;
  title: string;
  icon: LucideIcon;
}

export interface CuentaCockpitSection {
  title: string;
  options: readonly CuentaCockpitOption[];
}

export const CUENTA_COCKPIT_TITLE = "Control de cuenta" as const;

export const CUENTA_COCKPIT_SECTIONS: readonly CuentaCockpitSection[] = [
  {
    title: "Cuenta",
    options: [
      { id: "acceso", title: "Acceso", icon: ShieldCheck },
      { id: "usuarios", title: "Usuarios", icon: Users },
      { id: "bodegas", title: "Bodegas", icon: Warehouse },
    ],
  },
  {
    title: "Maestros",
    options: [
      { id: "catalogo", title: "Catálogo", icon: Package },
      { id: "lista-precio", title: "Lista de precio", icon: Tags },
      { id: "proveedores", title: "Proveedores", icon: LayoutGrid },
      { id: "clientes", title: "Clientes", icon: Building2 },
      { id: "compradores", title: "Compradores", icon: ShoppingCart },
      { id: "camiones", title: "Camiones", icon: Truck },
      { id: "plantas", title: "Plantas", icon: Factory },
    ],
  },
  {
    title: "Operación",
    options: [
      { id: "compras", title: "Compras", icon: ClipboardList },
      { id: "ventas", title: "Ventas", icon: ShoppingBag },
      { id: "transporte", title: "Transporte", icon: Truck },
      { id: "reportes", title: "Reportes", icon: BarChart3 },
    ],
  },
];

export const CUENTA_COCKPIT_MODULO_COPY = {
  acceso: {
    title: "Acceso",
    description: "Activa o desactiva el inicio de sesión de toda la cuenta. WMS y Mateo se conceden en cada usuario.",
    futureActions: [
      "Activar o desactivar la cuenta",
      "Cambiar el nombre comercial",
    ],
  },
  usuarios: {
    title: "Usuarios",
    description: "Usuarios de esta cuenta. En cada uno se concede WMS, Mateo IA, o ambos.",
    futureActions: [
      "Alta de usuario de la cuenta",
      "Asignar rol",
      "Vincular bodega",
    ],
  },
  bodegas: {
    title: "Bodegas",
    description: "Bodegas asignadas y bodega por defecto de esta cuenta.",
    futureActions: [
      "Ver bodegas asignadas",
      "Elegir bodega por defecto",
    ],
  },
  catalogo: {
    title: "Catálogo",
    description: "Catálogo de productos de esta cuenta.",
    futureActions: [
      "Ver productos de la cuenta",
      "Editar SKU y datos maestros",
      "Activar o desactivar producto",
    ],
  },
  "lista-precio": {
    title: "Lista de precio",
    description: "Listas de precio de esta cuenta.",
    futureActions: [
      "Ver listas de la cuenta",
      "Editar precios",
      "Activar o desactivar lista",
    ],
  },
  proveedores: {
    title: "Proveedores",
    description: "Proveedores vinculados a esta cuenta.",
    futureActions: [
      "Alta de proveedor",
      "Editar datos de contacto",
      "Activar o desactivar proveedor",
    ],
  },
  clientes: {
    title: "Clientes",
    description: "Clientes vinculados a esta cuenta.",
    futureActions: [
      "Alta de cliente",
      "Editar datos fiscales",
      "Activar o desactivar cliente",
    ],
  },
  compradores: {
    title: "Compradores",
    description: "Compradores de esta cuenta.",
    futureActions: [
      "Registrar comprador",
      "Editar datos",
      "Activar o desactivar comprador",
    ],
  },
  camiones: {
    title: "Camiones",
    description: "Flota de transporte de esta cuenta.",
    futureActions: [
      "Registrar camión",
      "Editar capacidad",
      "Activar o desactivar camión",
    ],
  },
  plantas: {
    title: "Plantas",
    description: "Plantas de esta cuenta.",
    futureActions: [
      "Registrar planta",
      "Editar capacidad y rango térmico",
      "Activar o desactivar planta",
    ],
  },
  compras: {
    title: "Compras",
    description: "Órdenes y solicitudes de compra de esta cuenta.",
    futureActions: [
      "Ver compras de la cuenta",
      "Revisar estados",
      "Auditar movimientos",
    ],
  },
  ventas: {
    title: "Ventas",
    description: "Órdenes de venta de esta cuenta.",
    futureActions: [
      "Ver ventas de la cuenta",
      "Revisar estados",
      "Auditar movimientos",
    ],
  },
  transporte: {
    title: "Transporte",
    description: "Operación de transporte de esta cuenta.",
    futureActions: [
      "Ver despachos de la cuenta",
      "Revisar estados",
      "Auditar movimientos",
    ],
  },
  reportes: {
    title: "Reportes",
    description: "Reportería de esta cuenta.",
    futureActions: [
      "Ver reportes de la cuenta",
      "Exportar información",
      "Auditar actividad",
    ],
  },
} as const satisfies Record<
  CuentaCockpitModuloId,
  {
    title: string;
    description: string;
    futureActions: readonly string[];
  }
>;

const CUENTA_COCKPIT_MODULO_IDS = new Set<string>(
  CUENTA_COCKPIT_SECTIONS.flatMap((section) =>
    section.options.map((option) => option.id),
  ),
);

export function isCuentaCockpitModuloId(
  value: string,
): value is CuentaCockpitModuloId {
  return CUENTA_COCKPIT_MODULO_IDS.has(value);
}

export function isCuentaCockpitModalModulo(
  value: string,
): value is "acceso" | "bodegas" {
  return value === "acceso" || value === "bodegas";
}

export function getCuentaCockpitOption(
  id: CuentaCockpitModuloId,
): CuentaCockpitOption | null {
  for (const section of CUENTA_COCKPIT_SECTIONS) {
    const option = section.options.find((item) => item.id === id);
    if (option) return option;
  }
  return null;
}

export function getCuentaGobiernoHref(codigoCuenta: string): string {
  return `${ROUTES.configuratorAccounts}/${encodeURIComponent(codigoCuenta)}`;
}

export function getCuentaGobiernoModuloHref(
  codigoCuenta: string,
  modulo: CuentaCockpitModuloId,
): string {
  return `${getCuentaGobiernoHref(codigoCuenta)}/${modulo}`;
}
