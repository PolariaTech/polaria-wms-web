#!/usr/bin/env node
/**
 * Reorganiza el proyecto en subcarpetas por dominio.
 * Uso: node scripts/reorganize-full-project.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

/** @type {Array<[string, string]>} */
const moves = [
  // ── components/auth ──────────────────────────────────────────────
  ["src/components/auth/AuthGuard.tsx", "src/components/auth/guards/AuthGuard.tsx"],
  ["src/components/auth/AuthGuard.test.tsx", "src/components/auth/guards/AuthGuard.test.tsx"],
  ["src/components/auth/RoleGate.tsx", "src/components/auth/guards/RoleGate.tsx"],
  ["src/components/auth/RoleGate.test.tsx", "src/components/auth/guards/RoleGate.test.tsx"],
  ["src/components/auth/PlatformScopeGuard.tsx", "src/components/auth/guards/PlatformScopeGuard.tsx"],
  ["src/components/auth/PlatformScopeGuard.test.tsx", "src/components/auth/guards/PlatformScopeGuard.test.tsx"],
  ["src/components/auth/TenantScopeGuard.tsx", "src/components/auth/guards/TenantScopeGuard.tsx"],
  ["src/components/auth/TenantScopeGuard.test.tsx", "src/components/auth/guards/TenantScopeGuard.test.tsx"],
  ["src/components/auth/BodegaRequiredGuard.tsx", "src/components/auth/guards/BodegaRequiredGuard.tsx"],
  ["src/components/auth/BodegaRequiredGuard.test.tsx", "src/components/auth/guards/BodegaRequiredGuard.test.tsx"],
  ["src/components/auth/AdminAccountGuard.tsx", "src/components/auth/guards/AdminAccountGuard.tsx"],
  ["src/components/auth/BodegaOperacionLegacyRedirect.tsx", "src/components/auth/guards/BodegaOperacionLegacyRedirect.tsx"],
  ["src/components/auth/LoginFlow.tsx", "src/components/auth/login/LoginFlow.tsx"],
  ["src/components/auth/LoginFlow.test.tsx", "src/components/auth/login/LoginFlow.test.tsx"],
  ["src/components/auth/LoginStepPassword.tsx", "src/components/auth/login/LoginStepPassword.tsx"],
  ["src/components/auth/LoginStepSuccess.tsx", "src/components/auth/login/LoginStepSuccess.tsx"],
  ["src/components/auth/LoginStepUser.tsx", "src/components/auth/login/LoginStepUser.tsx"],
  ["src/components/auth/SsoFlow.tsx", "src/components/auth/sso/SsoFlow.tsx"],
  ["src/components/auth/SsoFlow.test.tsx", "src/components/auth/sso/SsoFlow.test.tsx"],
  ["src/components/auth/AuthSessionBootstrap.tsx", "src/components/auth/session/AuthSessionBootstrap.tsx"],
  ["src/components/auth/AuthSessionScript.tsx", "src/components/auth/session/AuthSessionScript.tsx"],

  // ── components/layouts ───────────────────────────────────────────
  ["src/components/layouts/AppShellLayout.tsx", "src/components/layouts/shell/AppShellLayout.tsx"],
  ["src/components/layouts/AppShellLayout.test.tsx", "src/components/layouts/shell/AppShellLayout.test.tsx"],
  ["src/components/layouts/AppTopbar.tsx", "src/components/layouts/shell/AppTopbar.tsx"],
  ["src/components/layouts/AuthLayout.tsx", "src/components/layouts/auth/AuthLayout.tsx"],

  // ── components/shared ────────────────────────────────────────────
  ["src/components/shared/PolariaDataTable.tsx", "src/components/shared/table/PolariaDataTable.tsx"],
  ["src/components/shared/PolariaDataTable.test.tsx", "src/components/shared/table/PolariaDataTable.test.tsx"],
  ["src/components/shared/PolariaTableCells.tsx", "src/components/shared/table/PolariaTableCells.tsx"],
  ["src/components/shared/PolariaTablePaginationFooter.tsx", "src/components/shared/table/PolariaTablePaginationFooter.tsx"],
  ["src/components/shared/polaria-table-layout.ts", "src/components/shared/table/polaria-table-layout.ts"],
  ["src/components/shared/PolariaFormField.tsx", "src/components/shared/form/PolariaFormField.tsx"],
  ["src/components/shared/PolariaFormModal.tsx", "src/components/shared/form/PolariaFormModal.tsx"],
  ["src/components/shared/PolariaFormModal.test.tsx", "src/components/shared/form/PolariaFormModal.test.tsx"],
  ["src/components/shared/PolariaPhoneInput.tsx", "src/components/shared/form/PolariaPhoneInput.tsx"],
  ["src/components/shared/ModuleListPage.tsx", "src/components/shared/module/ModuleListPage.tsx"],
  ["src/components/shared/ModuleListPage.test.tsx", "src/components/shared/module/ModuleListPage.test.tsx"],
  ["src/components/shared/ModulePlaceholder.tsx", "src/components/shared/module/ModulePlaceholder.tsx"],
  ["src/components/shared/ModuleRoleGate.tsx", "src/components/shared/module/ModuleRoleGate.tsx"],
  ["src/components/shared/OperationalModuleShell.tsx", "src/components/shared/module/OperationalModuleShell.tsx"],
  ["src/components/shared/PolariaSelectionCard.tsx", "src/components/shared/cards/PolariaSelectionCard.tsx"],
  ["src/components/shared/formatters.ts", "src/components/shared/utils/formatters.ts"],

  // ── modules/purchases ────────────────────────────────────────────
  ["src/modules/purchases/components/SolicitudCompraCreateModal.tsx", "src/modules/purchases/solicitudes/components/SolicitudCompraCreateModal.tsx"],
  ["src/modules/purchases/components/SolicitudCompraDetalleModal.tsx", "src/modules/purchases/solicitudes/components/SolicitudCompraDetalleModal.tsx"],
  ["src/modules/purchases/components/SolicitudCompraDetalleModal.test.tsx", "src/modules/purchases/solicitudes/components/SolicitudCompraDetalleModal.test.tsx"],
  ["src/modules/purchases/services/solicitud-compra-n8n-client.service.ts", "src/modules/purchases/solicitudes/services/solicitud-compra-n8n-client.service.ts"],
  ["src/modules/purchases/services/solicitud-compra-n8n-client.service.test.ts", "src/modules/purchases/solicitudes/services/solicitud-compra-n8n-client.service.test.ts"],
  ["src/modules/purchases/utils/solicitud-compra-display.ts", "src/modules/purchases/solicitudes/utils/solicitud-compra-display.ts"],
  ["src/modules/purchases/utils/solicitud-compra-display.test.ts", "src/modules/purchases/solicitudes/utils/solicitud-compra-display.test.ts"],
  ["src/modules/purchases/components/OrdenCompraCreateModal.tsx", "src/modules/purchases/ordenes/components/OrdenCompraCreateModal.tsx"],
  ["src/modules/purchases/components/OrdenCompraDetalleModal.tsx", "src/modules/purchases/ordenes/components/OrdenCompraDetalleModal.tsx"],
  ["src/modules/purchases/components/OrdenCompraDetalleModal.test.tsx", "src/modules/purchases/ordenes/components/OrdenCompraDetalleModal.test.tsx"],
  ["src/modules/purchases/services/pedido-proveedor-client.service.ts", "src/modules/purchases/ordenes/services/pedido-proveedor-client.service.ts"],
  ["src/modules/purchases/services/pedido-proveedor-client.service.test.ts", "src/modules/purchases/ordenes/services/pedido-proveedor-client.service.test.ts"],
  ["src/modules/purchases/utils/orden-compra-display.ts", "src/modules/purchases/ordenes/utils/orden-compra-display.ts"],
  ["src/modules/purchases/utils/orden-compra-display.test.ts", "src/modules/purchases/ordenes/utils/orden-compra-display.test.ts"],
  ["src/modules/purchases/components/IngresoPageContent.tsx", "src/modules/purchases/ingreso/components/IngresoPageContent.tsx"],
  ["src/modules/purchases/components/RecepcionCompraModal.tsx", "src/modules/purchases/ingreso/components/RecepcionCompraModal.tsx"],
  ["src/modules/purchases/constants/recepcion-compra.constants.ts", "src/modules/purchases/ingreso/constants/recepcion-compra.constants.ts"],
  ["src/modules/purchases/components/ComprasPageContent.tsx", "src/modules/purchases/compras/components/ComprasPageContent.tsx"],
  ["src/modules/purchases/components/ComprasPageContent.test.tsx", "src/modules/purchases/compras/components/ComprasPageContent.test.tsx"],
  ["src/modules/purchases/types/purchases.types.ts", "src/modules/purchases/shared/types/purchases.types.ts"],
  ["src/modules/purchases/types/purchases-api.types.ts", "src/modules/purchases/shared/types/purchases-api.types.ts"],
  ["src/modules/purchases/constants/purchases-labels.ts", "src/modules/purchases/shared/constants/purchases-labels.ts"],
  ["src/modules/purchases/constants/compras-table-layout.ts", "src/modules/purchases/shared/constants/compras-table-layout.ts"],
  ["src/modules/purchases/services/purchases.service.ts", "src/modules/purchases/shared/services/purchases.service.ts"],
  ["src/modules/purchases/services/purchases.service.test.ts", "src/modules/purchases/shared/services/purchases.service.test.ts"],
  ["src/modules/purchases/services/purchases-api.service.ts", "src/modules/purchases/shared/services/purchases-api.service.ts"],
  ["src/modules/purchases/services/purchases-api.service.test.ts", "src/modules/purchases/shared/services/purchases-api.service.test.ts"],
  ["src/modules/purchases/utils/compras-table-display.ts", "src/modules/purchases/shared/utils/compras-table-display.ts"],
  ["src/modules/purchases/utils/compras-table-display.test.ts", "src/modules/purchases/shared/utils/compras-table-display.test.ts"],

  // ── modules/dashboard ──────────────────────────────────────────────
  ["src/modules/dashboard/components/DashboardHome.tsx", "src/modules/dashboard/home/components/DashboardHome.tsx"],
  ["src/modules/dashboard/components/DashboardHome.test.tsx", "src/modules/dashboard/home/components/DashboardHome.test.tsx"],
  ["src/modules/dashboard/components/DashboardWidget.tsx", "src/modules/dashboard/home/components/DashboardWidget.tsx"],
  ["src/modules/dashboard/constants/dashboard-widgets.ts", "src/modules/dashboard/home/constants/dashboard-widgets.ts"],
  ["src/modules/dashboard/constants/dashboard-widgets.test.ts", "src/modules/dashboard/home/constants/dashboard-widgets.test.ts"],
  ["src/modules/dashboard/components/OperadorCuentaHub.tsx", "src/modules/dashboard/operador-cuenta/components/OperadorCuentaHub.tsx"],
  ["src/modules/dashboard/components/OperadorCuentaHub.test.tsx", "src/modules/dashboard/operador-cuenta/components/OperadorCuentaHub.test.tsx"],
  ["src/modules/dashboard/components/OperadorCuentaBreadcrumb.tsx", "src/modules/dashboard/operador-cuenta/components/OperadorCuentaBreadcrumb.tsx"],
  ["src/modules/dashboard/components/OperadorCuentaBreadcrumb.test.tsx", "src/modules/dashboard/operador-cuenta/components/OperadorCuentaBreadcrumb.test.tsx"],
  ["src/modules/dashboard/constants/operador-cuenta-hub.ts", "src/modules/dashboard/operador-cuenta/constants/operador-cuenta-hub.ts"],
  ["src/modules/dashboard/components/DashboardPageContent.tsx", "src/modules/dashboard/shell/components/DashboardPageContent.tsx"],
  ["src/modules/dashboard/components/DashboardPageContent.test.tsx", "src/modules/dashboard/shell/components/DashboardPageContent.test.tsx"],
  ["src/modules/dashboard/services/dashboard-data.ts", "src/modules/dashboard/shared/services/dashboard-data.ts"],
  ["src/modules/dashboard/types/dashboard.types.ts", "src/modules/dashboard/shared/types/dashboard.types.ts"],

  // ── modules/inventory ──────────────────────────────────────────────
  ["src/modules/inventory/components/MapaInventarioPageContent.tsx", "src/modules/inventory/mapa/components/MapaInventarioPageContent.tsx"],
  ["src/modules/inventory/services/inventory.service.ts", "src/modules/inventory/shared/services/inventory.service.ts"],
  ["src/modules/inventory/services/inventory.service.test.ts", "src/modules/inventory/shared/services/inventory.service.test.ts"],
  ["src/modules/inventory/services/inventory-api.service.ts", "src/modules/inventory/shared/services/inventory-api.service.ts"],
  ["src/modules/inventory/services/inventory-api.service.test.ts", "src/modules/inventory/shared/services/inventory-api.service.test.ts"],
  ["src/modules/inventory/types/inventory.types.ts", "src/modules/inventory/shared/types/inventory.types.ts"],
  ["src/modules/inventory/types/inventory-api.types.ts", "src/modules/inventory/shared/types/inventory-api.types.ts"],
  ["src/modules/inventory/constants/inventory-lock.constants.ts", "src/modules/inventory/shared/constants/inventory-lock.constants.ts"],
  ["src/modules/inventory/hooks/useWarehouseStateSubscription.ts", "src/modules/inventory/shared/hooks/useWarehouseStateSubscription.ts"],

  // ── modules/sales ──────────────────────────────────────────────────
  ["src/modules/sales/components/VentasPageContent.tsx", "src/modules/sales/ordenes/components/VentasPageContent.tsx"],
  ["src/modules/sales/components/OrdenVentaCreateModal.tsx", "src/modules/sales/ordenes/components/OrdenVentaCreateModal.tsx"],
  ["src/modules/sales/components/OperadorOrdenesVentaPageContent.tsx", "src/modules/sales/ordenes/components/OperadorOrdenesVentaPageContent.tsx"],
  ["src/modules/sales/components/VentasOperadorHub.tsx", "src/modules/sales/operador/components/VentasOperadorHub.tsx"],
  ["src/modules/sales/services/sales.service.ts", "src/modules/sales/shared/services/sales.service.ts"],
  ["src/modules/sales/services/sales.service.test.ts", "src/modules/sales/shared/services/sales.service.test.ts"],
  ["src/modules/sales/types/sales.types.ts", "src/modules/sales/shared/types/sales.types.ts"],
  ["src/modules/sales/constants/sales-status.ts", "src/modules/sales/shared/constants/sales-status.ts"],

  // ── modules/processing ─────────────────────────────────────────────
  ["src/modules/processing/components/ProcesamientoPageContent.tsx", "src/modules/processing/solicitudes/components/ProcesamientoPageContent.tsx"],
  ["src/modules/processing/components/OrdenProcesamientoCreateModal.tsx", "src/modules/processing/solicitudes/components/OrdenProcesamientoCreateModal.tsx"],
  ["src/modules/processing/components/OperadorProcesamientoPageContent.tsx", "src/modules/processing/operador/components/OperadorProcesamientoPageContent.tsx"],
  ["src/modules/processing/components/BodegaInternaOperadorHub.tsx", "src/modules/processing/operador/components/BodegaInternaOperadorHub.tsx"],
  ["src/modules/processing/services/processing.service.ts", "src/modules/processing/shared/services/processing.service.ts"],
  ["src/modules/processing/services/processing.service.test.ts", "src/modules/processing/shared/services/processing.service.test.ts"],
  ["src/modules/processing/types/processing.types.ts", "src/modules/processing/shared/types/processing.types.ts"],
  ["src/modules/processing/constants/processing-status.ts", "src/modules/processing/shared/constants/processing-status.ts"],

  // ── modules/account-integration ────────────────────────────────────
  ["src/modules/account-integration/components/IntegracionBodegaPageContent.tsx", "src/modules/account-integration/integracion/components/IntegracionBodegaPageContent.tsx"],
  ["src/modules/account-integration/components/SolicitudIntegracionCreateModal.tsx", "src/modules/account-integration/integracion/components/SolicitudIntegracionCreateModal.tsx"],
  ["src/modules/account-integration/services/integracion-bodega.service.ts", "src/modules/account-integration/integracion/services/integracion-bodega.service.ts"],
  ["src/modules/account-integration/services/integracion-bodega.service.test.ts", "src/modules/account-integration/integracion/services/integracion-bodega.service.test.ts"],
  ["src/modules/account-integration/constants/integration-types.ts", "src/modules/account-integration/integracion/constants/integration-types.ts"],
  ["src/modules/account-integration/components/BodegaExternaOperadorHub.tsx", "src/modules/account-integration/operador/components/BodegaExternaOperadorHub.tsx"],
  ["src/modules/account-integration/types/integration.types.ts", "src/modules/account-integration/shared/types/integration.types.ts"],

  // ── modules/transport ──────────────────────────────────────────────
  ["src/modules/transport/components/TransportePageContent.tsx", "src/modules/transport/guias/components/TransportePageContent.tsx"],
  ["src/modules/transport/services/transport.service.ts", "src/modules/transport/shared/services/transport.service.ts"],
  ["src/modules/transport/services/transport.service.test.ts", "src/modules/transport/shared/services/transport.service.test.ts"],
  ["src/modules/transport/types/transport.types.ts", "src/modules/transport/shared/types/transport.types.ts"],

  // ── lib ────────────────────────────────────────────────────────────
  ["src/lib/auth-routes.ts", "src/lib/auth/auth-routes.ts"],
  ["src/lib/auth-routes.test.ts", "src/lib/auth/auth-routes.test.ts"],
  ["src/lib/auth-storage.ts", "src/lib/auth/auth-storage.ts"],
  ["src/lib/auth-storage.test.ts", "src/lib/auth/auth-storage.test.ts"],
  ["src/lib/auth-sync.ts", "src/lib/auth/auth-sync.ts"],
  ["src/lib/auth-sync.test.ts", "src/lib/auth/auth-sync.test.ts"],
  ["src/lib/auth-hash-import.ts", "src/lib/auth/auth-hash-import.ts"],
  ["src/lib/auth-hash-import.test.ts", "src/lib/auth/auth-hash-import.test.ts"],
  ["src/lib/auth-session.ts", "src/lib/auth/auth-session.ts"],
  ["src/lib/auth-broadcast.ts", "src/lib/auth/auth-broadcast.ts"],
  ["src/lib/auth-context.ts", "src/lib/auth/auth-context.ts"],
  ["src/lib/mateo-sso-exit.ts", "src/lib/auth/mateo-sso-exit.ts"],
  ["src/lib/mateo-sso-exit.test.ts", "src/lib/auth/mateo-sso-exit.test.ts"],
  ["src/lib/cn.ts", "src/lib/utils/cn.ts"],
  ["src/lib/decimal-es.ts", "src/lib/utils/decimal-es.ts"],
  ["src/lib/decimal-es.test.ts", "src/lib/utils/decimal-es.test.ts"],
  ["src/lib/domain-service-error.ts", "src/lib/utils/domain-service-error.ts"],
  ["src/lib/domain-service-error.test.ts", "src/lib/utils/domain-service-error.test.ts"],
  ["src/lib/generate-codigo-cuenta.ts", "src/lib/utils/generate-codigo-cuenta.ts"],
  ["src/lib/generate-codigo-cuenta.test.ts", "src/lib/utils/generate-codigo-cuenta.test.ts"],
  ["src/lib/normalize-nivel-rol.ts", "src/lib/utils/normalize-nivel-rol.ts"],
  ["src/lib/normalize-nivel-rol.test.ts", "src/lib/utils/normalize-nivel-rol.test.ts"],
  ["src/lib/active-bodega.ts", "src/lib/utils/active-bodega.ts"],
  ["src/lib/tenant-headers.ts", "src/lib/utils/tenant-headers.ts"],
  ["src/lib/tenant-headers.test.ts", "src/lib/utils/tenant-headers.test.ts"],

  // ── hooks ──────────────────────────────────────────────────────────
  ["src/hooks/usePermissions.ts", "src/hooks/auth/usePermissions.ts"],
  ["src/hooks/usePermissions.test.tsx", "src/hooks/auth/usePermissions.test.tsx"],
  ["src/hooks/useClientTablePagination.ts", "src/hooks/table/useClientTablePagination.ts"],
  ["src/hooks/useWarehouseStateRealtime.ts", "src/hooks/warehouse/useWarehouseStateRealtime.ts"],
  ["src/hooks/useWarehouseStateRealtime.test.tsx", "src/hooks/warehouse/useWarehouseStateRealtime.test.tsx"],
  ["src/hooks/useAsyncQuery.ts", "src/hooks/shared/useAsyncQuery.ts"],
  ["src/hooks/useTenantList.ts", "src/hooks/shared/useTenantList.ts"],
  ["src/hooks/useLiveDate.ts", "src/hooks/shared/useLiveDate.ts"],

  // ── constants ──────────────────────────────────────────────────────
  ["src/constants/roles.ts", "src/constants/wms/roles.ts"],
  ["src/constants/permissions.ts", "src/constants/wms/permissions.ts"],
  ["src/constants/wms-roles.ts", "src/constants/wms/wms-roles.ts"],
  ["src/constants/phone-countries.ts", "src/constants/ui/phone-countries.ts"],
  ["src/constants/phone-countries.test.ts", "src/constants/ui/phone-countries.test.ts"],
  ["src/constants/table-pagination.ts", "src/constants/ui/table-pagination.ts"],
  ["src/constants/brand.ts", "src/constants/brand/brand.ts"],

  // ── providers ──────────────────────────────────────────────────────
  ["src/providers/AuthProvider.tsx", "src/providers/auth/AuthProvider.tsx"],
  ["src/providers/CompanyProvider.tsx", "src/providers/tenant/CompanyProvider.tsx"],
  ["src/providers/CompanyProvider.test.tsx", "src/providers/tenant/CompanyProvider.test.tsx"],

  // ── services ───────────────────────────────────────────────────────
  ["src/services/api.ts", "src/services/api/api.ts"],
  ["src/services/api.test.ts", "src/services/api/api.test.ts"],
  ["src/services/supabase.ts", "src/services/supabase/supabase.ts"],

  // ── types ──────────────────────────────────────────────────────────
  ["src/types/auth.ts", "src/types/auth/auth.ts"],
  ["src/types/auth.test.ts", "src/types/auth/auth.test.ts"],
  ["src/types/layout.ts", "src/types/layout/layout.ts"],
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveFile(from, to) {
  const fromPath = path.join(root, from);
  const toPath = path.join(root, to);
  if (!fs.existsSync(fromPath)) return false;
  if (fs.existsSync(toPath)) {
    console.warn(`Skip (exists): ${to}`);
    return false;
  }
  ensureDir(toPath);
  fs.renameSync(fromPath, toPath);
  return true;
}

let moved = 0;
for (const [from, to] of moves) {
  if (moveFile(from, to)) moved += 1;
}
console.log(`Moved ${moved} files`);

const legacyDirs = [
  "src/modules/purchases/components",
  "src/modules/purchases/services",
  "src/modules/purchases/constants",
  "src/modules/purchases/types",
  "src/modules/purchases/utils",
  "src/modules/dashboard/components",
  "src/modules/dashboard/constants",
  "src/modules/dashboard/services",
  "src/modules/dashboard/types",
  "src/modules/inventory/components",
  "src/modules/inventory/services",
  "src/modules/inventory/types",
  "src/modules/inventory/constants",
  "src/modules/inventory/hooks",
  "src/modules/sales/components",
  "src/modules/sales/services",
  "src/modules/sales/types",
  "src/modules/sales/constants",
  "src/modules/processing/components",
  "src/modules/processing/services",
  "src/modules/processing/types",
  "src/modules/processing/constants",
  "src/modules/account-integration/components",
  "src/modules/account-integration/services",
  "src/modules/account-integration/constants",
  "src/modules/account-integration/types",
  "src/modules/transport/components",
  "src/modules/transport/services",
  "src/modules/transport/types",
];

for (const dir of legacyDirs) {
  const full = path.join(root, dir);
  if (fs.existsSync(full)) {
    const files = fs.readdirSync(full);
    if (files.length === 0) {
      fs.rmdirSync(full);
      console.log(`Removed empty ${dir}`);
    }
  }
}

console.log("Done moving. Run fix-all-imports.mjs next.");
