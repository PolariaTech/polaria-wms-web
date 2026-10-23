import {
  BarChart3,
  Building2,
  ClipboardList,
  Factory,
  LayoutGrid,
  Package,
  Printer,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Timer,
  Truck,
  Users,
  Warehouse,
  Globe2,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import type { LucideIcon } from "lucide-react";

export type CuentaCockpitModuloId =
  | "acceso"
  | "usuarios"
  | "bodegas"
  | "impresoras"
  | "sla"
  | "zona-horaria"
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
      { id: "impresoras", title: "Impresoras", icon: Printer },
      { id: "sla", title: "SLA / Alertas", icon: Timer },
      { id: "zona-horaria", title: "Zona horaria", icon: Globe2 },
    ],
  },
  {
    title: "Maestros",
    options: [
      { id: "catalogo", title: "Catálogo", icon: Package },
      { id: "lista-precio", title: "Lista de precio", icon: Tags },
      { id: "proveedores", title: "Proveedores", icon: LayoutGrid },
      { id: "clientes", title: "Grupos", icon: Building2 },
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
  impresoras: {
    title: "Impresoras",
    description:
      "Impresoras de esta cuenta (QZ Tray, Brother correo o Epson Connect). Aplican a todos los usuarios de la cuenta.",
    futureActions: [
      "Configurar impresora",
      "Elegir camino de envío",
      "Probar impresión",
    ],
  },
  sla: {
    title: "SLA / Alertas",
    description:
      "Tiempos por etapa de órdenes de venta: SLA (atrasada) y alerta (en riesgo).",
    futureActions: [
      "Definir minutos de SLA",
      "Definir minutos de alerta",
    ],
  },
  "zona-horaria": {
    title: "Zona horaria",
    description:
      "Zona en la que se muestran e imprimen las horas de esta cuenta (UTC en base).",
    futureActions: [
      "Elegir zona IANA",
      "Aplicar a lista, log e impresión",
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
    title: "Grupos",
    description: "Grupos vinculados a esta cuenta: la empresa dueña de varios compradores.",
    futureActions: [
      "Alta de grupo",
      "Editar datos fiscales",
      "Activar o desactivar grupo",
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
