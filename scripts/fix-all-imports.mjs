#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

/** Generado a partir de reorganize-full-project.mjs — ordenar de más largo a más corto */
const importReplacements = [
  // components/shared
  ["@/components/shared/PolariaTablePaginationFooter", "@/components/shared/table/PolariaTablePaginationFooter"],
  ["@/components/shared/polaria-table-layout", "@/components/shared/table/polaria-table-layout"],
  ["@/components/shared/PolariaDataTable", "@/components/shared/table/PolariaDataTable"],
  ["@/components/shared/PolariaTableCells", "@/components/shared/table/PolariaTableCells"],
  ["@/components/shared/PolariaFormModal", "@/components/shared/form/PolariaFormModal"],
  ["@/components/shared/PolariaFormField", "@/components/shared/form/PolariaFormField"],
  ["@/components/shared/PolariaPhoneInput", "@/components/shared/form/PolariaPhoneInput"],
  ["@/components/shared/OperationalModuleShell", "@/components/shared/module/OperationalModuleShell"],
  ["@/components/shared/ModuleListPage", "@/components/shared/module/ModuleListPage"],
  ["@/components/shared/ModuleRoleGate", "@/components/shared/module/ModuleRoleGate"],
  ["@/components/shared/ModulePlaceholder", "@/components/shared/module/ModulePlaceholder"],
  ["@/components/shared/PolariaSelectionCard", "@/components/shared/cards/PolariaSelectionCard"],
  ["@/components/shared/formatters", "@/components/shared/utils/formatters"],

  // components/auth
  ["@/components/auth/BodegaOperacionLegacyRedirect", "@/components/auth/guards/BodegaOperacionLegacyRedirect"],
  ["@/components/auth/BodegaRequiredGuard", "@/components/auth/guards/BodegaRequiredGuard"],
  ["@/components/auth/PlatformScopeGuard", "@/components/auth/guards/PlatformScopeGuard"],
  ["@/components/auth/AdminAccountGuard", "@/components/auth/guards/AdminAccountGuard"],
  ["@/components/auth/TenantScopeGuard", "@/components/auth/guards/TenantScopeGuard"],
  ["@/components/auth/AuthSessionBootstrap", "@/components/auth/session/AuthSessionBootstrap"],
  ["@/components/auth/AuthSessionScript", "@/components/auth/session/AuthSessionScript"],
  ["@/components/auth/AuthGuard", "@/components/auth/guards/AuthGuard"],
  ["@/components/auth/RoleGate", "@/components/auth/guards/RoleGate"],
  ["@/components/auth/LoginFlow", "@/components/auth/login/LoginFlow"],
  ["@/components/auth/LoginStepPassword", "@/components/auth/login/LoginStepPassword"],
  ["@/components/auth/LoginStepSuccess", "@/components/auth/login/LoginStepSuccess"],
  ["@/components/auth/LoginStepUser", "@/components/auth/login/LoginStepUser"],
  ["@/components/auth/SsoFlow", "@/components/auth/sso/SsoFlow"],

  // components/layouts
  ["@/components/layouts/AppShellLayout", "@/components/layouts/shell/AppShellLayout"],
  ["@/components/layouts/AppTopbar", "@/components/layouts/shell/AppTopbar"],
  ["@/components/layouts/AuthLayout", "@/components/layouts/auth/AuthLayout"],

  // modules/purchases (barrel paths)
  ["@/modules/purchases/components/ComprasPageContent", "@/modules/purchases/compras/components/ComprasPageContent"],
  ["@/modules/purchases/components/IngresoPageContent", "@/modules/purchases/ingreso/components/IngresoPageContent"],
  ["@/modules/purchases/components/SolicitudCompraCreateModal", "@/modules/purchases/solicitudes/components/SolicitudCompraCreateModal"],
  ["@/modules/purchases/components/SolicitudCompraDetalleModal", "@/modules/purchases/solicitudes/components/SolicitudCompraDetalleModal"],
  ["@/modules/purchases/components/OrdenCompraCreateModal", "@/modules/purchases/ordenes/components/OrdenCompraCreateModal"],
  ["@/modules/purchases/components/OrdenCompraDetalleModal", "@/modules/purchases/ordenes/components/OrdenCompraDetalleModal"],
  ["@/modules/purchases/components/RecepcionCompraModal", "@/modules/purchases/ingreso/components/RecepcionCompraModal"],
  ["@/modules/purchases/services/purchases-api.service", "@/modules/purchases/shared/services/purchases-api.service"],
  ["@/modules/purchases/services/purchases.service", "@/modules/purchases/shared/services/purchases.service"],
  ["@/modules/purchases/services/pedido-proveedor-client.service", "@/modules/purchases/ordenes/services/pedido-proveedor-client.service"],
  ["@/modules/purchases/services/solicitud-compra-n8n-client.service", "@/modules/purchases/solicitudes/services/solicitud-compra-n8n-client.service"],
  ["@/modules/purchases/constants/recepcion-compra.constants", "@/modules/purchases/ingreso/constants/recepcion-compra.constants"],
  ["@/modules/purchases/constants/purchases-labels", "@/modules/purchases/shared/constants/purchases-labels"],
  ["@/modules/purchases/constants/compras-table-layout", "@/modules/purchases/shared/constants/compras-table-layout"],
  ["@/modules/purchases/types/purchases-api.types", "@/modules/purchases/shared/types/purchases-api.types"],
  ["@/modules/purchases/types/purchases.types", "@/modules/purchases/shared/types/purchases.types"],
  ["@/modules/purchases/utils/orden-compra-display", "@/modules/purchases/ordenes/utils/orden-compra-display"],
  ["@/modules/purchases/utils/solicitud-compra-display", "@/modules/purchases/solicitudes/utils/solicitud-compra-display"],
  ["@/modules/purchases/utils/compras-table-display", "@/modules/purchases/shared/utils/compras-table-display"],

  // modules/dashboard
  ["@/modules/dashboard/components/DashboardPageContent", "@/modules/dashboard/shell/components/DashboardPageContent"],
  ["@/modules/dashboard/components/OperadorCuentaBreadcrumb", "@/modules/dashboard/operador-cuenta/components/OperadorCuentaBreadcrumb"],
  ["@/modules/dashboard/components/OperadorCuentaHub", "@/modules/dashboard/operador-cuenta/components/OperadorCuentaHub"],
  ["@/modules/dashboard/components/DashboardWidget", "@/modules/dashboard/home/components/DashboardWidget"],
  ["@/modules/dashboard/components/DashboardHome", "@/modules/dashboard/home/components/DashboardHome"],
  ["@/modules/dashboard/constants/operador-cuenta-hub", "@/modules/dashboard/operador-cuenta/constants/operador-cuenta-hub"],
  ["@/modules/dashboard/constants/dashboard-widgets", "@/modules/dashboard/home/constants/dashboard-widgets"],
  ["@/modules/dashboard/services/dashboard-data", "@/modules/dashboard/shared/services/dashboard-data"],
  ["@/modules/dashboard/types/dashboard.types", "@/modules/dashboard/shared/types/dashboard.types"],

  // modules/inventory
  ["@/modules/inventory/components/MapaInventarioPageContent", "@/modules/inventory/mapa/components/MapaInventarioPageContent"],
  ["@/modules/inventory/services/inventory-api.service", "@/modules/inventory/shared/services/inventory-api.service"],
  ["@/modules/inventory/services/inventory.service", "@/modules/inventory/shared/services/inventory.service"],
  ["@/modules/inventory/constants/inventory-lock.constants", "@/modules/inventory/shared/constants/inventory-lock.constants"],
  ["@/modules/inventory/types/inventory-api.types", "@/modules/inventory/shared/types/inventory-api.types"],
  ["@/modules/inventory/types/inventory.types", "@/modules/inventory/shared/types/inventory.types"],
  ["@/modules/inventory/hooks/useWarehouseStateSubscription", "@/modules/inventory/shared/hooks/useWarehouseStateSubscription"],

  // modules/sales
  ["@/modules/sales/components/OperadorOrdenesVentaPageContent", "@/modules/sales/ordenes/components/OperadorOrdenesVentaPageContent"],
  ["@/modules/sales/components/OrdenVentaCreateModal", "@/modules/sales/ordenes/components/OrdenVentaCreateModal"],
  ["@/modules/sales/components/VentasOperadorHub", "@/modules/sales/operador/components/VentasOperadorHub"],
  ["@/modules/sales/components/VentasPageContent", "@/modules/sales/ordenes/components/VentasPageContent"],
  ["@/modules/sales/constants/sales-status", "@/modules/sales/shared/constants/sales-status"],
  ["@/modules/sales/services/sales.service", "@/modules/sales/shared/services/sales.service"],
  ["@/modules/sales/types/sales.types", "@/modules/sales/shared/types/sales.types"],

  // modules/processing
  ["@/modules/processing/components/OperadorProcesamientoPageContent", "@/modules/processing/operador/components/OperadorProcesamientoPageContent"],
  ["@/modules/processing/components/BodegaInternaOperadorHub", "@/modules/processing/operador/components/BodegaInternaOperadorHub"],
  ["@/modules/processing/components/OrdenProcesamientoCreateModal", "@/modules/processing/solicitudes/components/OrdenProcesamientoCreateModal"],
  ["@/modules/processing/components/ProcesamientoPageContent", "@/modules/processing/solicitudes/components/ProcesamientoPageContent"],
  ["@/modules/processing/constants/processing-status", "@/modules/processing/shared/constants/processing-status"],
  ["@/modules/processing/services/processing.service", "@/modules/processing/shared/services/processing.service"],
  ["@/modules/processing/types/processing.types", "@/modules/processing/shared/types/processing.types"],

  // modules/account-integration
  ["@/modules/account-integration/components/SolicitudIntegracionCreateModal", "@/modules/account-integration/integracion/components/SolicitudIntegracionCreateModal"],
  ["@/modules/account-integration/components/IntegracionBodegaPageContent", "@/modules/account-integration/integracion/components/IntegracionBodegaPageContent"],
  ["@/modules/account-integration/components/BodegaExternaOperadorHub", "@/modules/account-integration/operador/components/BodegaExternaOperadorHub"],
  ["@/modules/account-integration/services/integracion-bodega.service", "@/modules/account-integration/integracion/services/integracion-bodega.service"],
  ["@/modules/account-integration/constants/integration-types", "@/modules/account-integration/integracion/constants/integration-types"],
  ["@/modules/account-integration/types/integration.types", "@/modules/account-integration/shared/types/integration.types"],

  // modules/transport
  ["@/modules/transport/components/TransportePageContent", "@/modules/transport/guias/components/TransportePageContent"],
  ["@/modules/transport/services/transport.service", "@/modules/transport/shared/services/transport.service"],
  ["@/modules/transport/types/transport.types", "@/modules/transport/shared/types/transport.types"],

  // lib
  ["@/lib/domain-service-error", "@/lib/utils/domain-service-error"],
  ["@/lib/generate-codigo-cuenta", "@/lib/utils/generate-codigo-cuenta"],
  ["@/lib/normalize-nivel-rol", "@/lib/utils/normalize-nivel-rol"],
  ["@/lib/auth-hash-import", "@/lib/auth/auth-hash-import"],
  ["@/lib/auth-broadcast", "@/lib/auth/auth-broadcast"],
  ["@/lib/auth-session", "@/lib/auth/auth-session"],
  ["@/lib/auth-context", "@/lib/auth/auth-context"],
  ["@/lib/auth-storage", "@/lib/auth/auth-storage"],
  ["@/lib/mateo-sso-exit", "@/lib/auth/mateo-sso-exit"],
  ["@/lib/tenant-headers", "@/lib/utils/tenant-headers"],
  ["@/lib/auth-routes", "@/lib/auth/auth-routes"],
  ["@/lib/auth-sync", "@/lib/auth/auth-sync"],
  ["@/lib/decimal-es", "@/lib/utils/decimal-es"],
  ["@/lib/active-bodega", "@/lib/utils/active-bodega"],
  ["@/lib/cn", "@/lib/utils/cn"],

  // hooks
  ["@/hooks/useWarehouseStateRealtime", "@/hooks/warehouse/useWarehouseStateRealtime"],
  ["@/hooks/useClientTablePagination", "@/hooks/table/useClientTablePagination"],
  ["@/hooks/usePermissions", "@/hooks/auth/usePermissions"],
  ["@/hooks/useAsyncQuery", "@/hooks/shared/useAsyncQuery"],
  ["@/hooks/useTenantList", "@/hooks/shared/useTenantList"],
  ["@/hooks/useLiveDate", "@/hooks/shared/useLiveDate"],

  // constants
  ["@/constants/phone-countries", "@/constants/ui/phone-countries"],
  ["@/constants/table-pagination", "@/constants/ui/table-pagination"],
  ["@/constants/permissions", "@/constants/wms/permissions"],
  ["@/constants/wms-roles", "@/constants/wms/wms-roles"],
  ["@/constants/roles", "@/constants/wms/roles"],
  ["@/constants/brand", "@/constants/brand/brand"],

  // providers / services / types
  ["@/providers/CompanyProvider", "@/providers/tenant/CompanyProvider"],
  ["@/providers/AuthProvider", "@/providers/auth/AuthProvider"],
  ["@/services/supabase", "@/services/supabase/supabase"],
  ["@/services/api", "@/services/api/api"],
  ["@/types/layout", "@/types/layout/layout"],
  ["@/types/auth", "@/types/auth/auth"],
];

const relativeReplacements = [
  // purchases cross-domain
  [/from "\.\.\/\.\.\/solicitudes\/components\/SolicitudCompraCreateModal"/g, 'from "../../solicitudes/components/SolicitudCompraCreateModal"'],
  [/from "\.\/SolicitudCompraCreateModal"/g, 'from "../../solicitudes/components/SolicitudCompraCreateModal"'],
  [/from "\.\/SolicitudCompraDetalleModal"/g, 'from "../../solicitudes/components/SolicitudCompraDetalleModal"'],
  [/from "\.\/OrdenCompraCreateModal"/g, 'from "../../ordenes/components/OrdenCompraCreateModal"'],
  [/from "\.\/OrdenCompraDetalleModal"/g, 'from "../../ordenes/components/OrdenCompraDetalleModal"'],
  [/from "\.\/RecepcionCompraModal"/g, 'from "../../ingreso/components/RecepcionCompraModal"'],
  [/from "\.\.\/constants\/purchases-labels"/g, 'from "../../shared/constants/purchases-labels"'],
  [/from "\.\.\/constants\/compras-table/g, 'from "../../shared/constants/compras-table'],
  [/from "\.\.\/services\/purchases/g, 'from "../../shared/services/purchases'],
  [/from "\.\.\/services\/pedido-proveedor/g, 'from "../../ordenes/services/pedido-proveedor'],
  [/from "\.\.\/services\/solicitud-compra/g, 'from "../services/solicitud-compra'],
  [/from "\.\.\/types\//g, 'from "../../shared/types/'],
  [/from "\.\.\/utils\/compras-table/g, 'from "../../shared/utils/compras-table'],
  [/from "\.\.\/utils\/orden-compra/g, 'from "../utils/orden-compra'],
  [/from "\.\.\/utils\/solicitud-compra/g, 'from "../utils/solicitud-compra'],

  // dashboard
  [/from "\.\/DashboardHome"/g, 'from "../../home/components/DashboardHome"'],
  [/from "\.\/OperadorCuentaHub"/g, 'from "../../operador-cuenta/components/OperadorCuentaHub"'],
  [/from "\.\/DashboardWidget"/g, 'from "../../home/components/DashboardWidget"'],
  [/from "\.\.\/constants\/dashboard-widgets"/g, 'from "../constants/dashboard-widgets"'],
  [/from "\.\.\/constants\/operador-cuenta-hub"/g, 'from "../constants/operador-cuenta-hub"'],
  [/from "\.\.\/services\/dashboard-data"/g, 'from "../../shared/services/dashboard-data"'],
  [/from "\.\.\/types\/dashboard\.types"/g, 'from "../../shared/types/dashboard.types"'],

  // inventory
  [/from "\.\.\/services\/inventory/g, 'from "../../shared/services/inventory'],
  [/from "\.\.\/types\/inventory/g, 'from "../../shared/types/inventory'],
  [/from "\.\.\/constants\/inventory/g, 'from "../../shared/constants/inventory'],

  // processing
  [/from "\.\.\/constants\/processing-status"/g, 'from "../../shared/constants/processing-status"'],
  [/from "\.\.\/services\/processing\.service"/g, 'from "../../shared/services/processing.service"'],
  [/from "\.\.\/types\/processing\.types"/g, 'from "../../shared/types/processing.types"'],

  // sales
  [/from "\.\.\/constants\/sales-status"/g, 'from "../../shared/constants/sales-status"'],
  [/from "\.\.\/services\/sales\.service"/g, 'from "../../shared/services/sales.service"'],
  [/from "\.\.\/types\/sales\.types"/g, 'from "../../shared/types/sales.types"'],

  // account-integration
  [/from "\.\.\/constants\/integration-types"/g, 'from "../constants/integration-types"'],
  [/from "\.\.\/services\/integracion-bodega\.service"/g, 'from "../services/integracion-bodega.service"'],
  [/from "\.\.\/types\/integration\.types"/g, 'from "../../shared/types/integration.types"'],

  // transport
  [/from "\.\.\/services\/transport\.service"/g, 'from "../../shared/services/transport.service"'],
  [/from "\.\.\/types\/transport\.types"/g, 'from "../../shared/types/transport.types"'],

  // permissions imports roles
  [/from "\.\/roles"/g, 'from "./roles"'],

  // wms-roles imports roles
  [/from "\.\/roles"/g, 'from "./roles"'],

  // constants/wms/permissions imports
  [/from "\.\/roles"/g, 'from "./roles"'],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = walk(path.join(root, "src"));
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  for (const [from, to] of importReplacements) {
    content = content.split(from).join(to);
  }

  if (file.includes(`${path.sep}modules${path.sep}purchases${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(0, 12)) {
      content = content.replace(pattern, replacement);
    }
  }
  if (file.includes(`${path.sep}modules${path.sep}dashboard${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(12, 19)) {
      content = content.replace(pattern, replacement);
    }
  }
  if (file.includes(`${path.sep}modules${path.sep}inventory${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(19, 22)) {
      content = content.replace(pattern, replacement);
    }
  }
  if (file.includes(`${path.sep}modules${path.sep}processing${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(22, 25)) {
      content = content.replace(pattern, replacement);
    }
  }
  if (file.includes(`${path.sep}modules${path.sep}sales${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(25, 28)) {
      content = content.replace(pattern, replacement);
    }
  }
  if (file.includes(`${path.sep}modules${path.sep}account-integration${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(28, 31)) {
      content = content.replace(pattern, replacement);
    }
  }
  if (file.includes(`${path.sep}modules${path.sep}transport${path.sep}`)) {
    for (const [pattern, replacement] of relativeReplacements.slice(31, 33)) {
      content = content.replace(pattern, replacement);
    }
  }

  // permissions.ts was in constants root, now wms/
  if (file.endsWith(`${path.sep}constants${path.sep}wms${path.sep}permissions.ts`)) {
    content = content.replace('from "./roles"', 'from "./roles"');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed += 1;
  }
}

console.log(`Updated imports in ${changed} files`);
