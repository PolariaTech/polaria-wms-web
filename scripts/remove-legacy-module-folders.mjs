import { rmSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const legacyDirs = [
  "src/modules/purchases/components",
  "src/modules/purchases/services",
  "src/modules/purchases/constants",
  "src/modules/purchases/types",
  "src/modules/purchases/utils",
  "src/modules/processing/components",
  "src/modules/processing/services",
  "src/modules/processing/constants",
  "src/modules/processing/types",
  "src/modules/dashboard/components",
  "src/modules/dashboard/services",
  "src/modules/dashboard/constants",
  "src/modules/dashboard/types",
  "src/modules/admin-panel/components",
  "src/modules/admin-panel/services",
  "src/modules/admin-panel/constants",
  "src/modules/admin-panel/types",
  "src/modules/admin-panel/utils",
  "src/modules/configurator/components",
  "src/modules/configurator/services",
  "src/modules/configurator/constants",
  "src/modules/configurator/types",
  "src/modules/sales/components",
  "src/modules/sales/services",
  "src/modules/sales/constants",
  "src/modules/sales/types",
  "src/modules/account-integration/components",
  "src/modules/account-integration/services",
  "src/modules/account-integration/constants",
  "src/modules/account-integration/types",
  "src/modules/inventory/components",
  "src/modules/inventory/services",
  "src/modules/inventory/constants",
  "src/modules/inventory/types",
  "src/modules/inventory/hooks",
  "src/modules/transport/components",
  "src/modules/transport/services",
  "src/modules/transport/types",
];

const legacyFiles = [
  // components/auth (flat duplicates)
  "src/components/auth/AdminAccountGuard.tsx",
  "src/components/auth/AuthGuard.tsx",
  "src/components/auth/AuthGuard.test.tsx",
  "src/components/auth/AuthSessionBootstrap.tsx",
  "src/components/auth/AuthSessionScript.tsx",
  "src/components/auth/BodegaRequiredGuard.tsx",
  "src/components/auth/BodegaRequiredGuard.test.tsx",
  "src/components/auth/PlatformScopeGuard.tsx",
  "src/components/auth/PlatformScopeGuard.test.tsx",
  "src/components/auth/RoleGate.tsx",
  "src/components/auth/RoleGate.test.tsx",
  "src/components/auth/TenantScopeGuard.tsx",
  "src/components/auth/TenantScopeGuard.test.tsx",
  "src/components/auth/LoginFlow.tsx",
  "src/components/auth/LoginFlow.test.tsx",
  "src/components/auth/LoginStepPassword.tsx",
  "src/components/auth/LoginStepSuccess.tsx",
  "src/components/auth/LoginStepUser.tsx",
  "src/components/auth/SsoFlow.tsx",
  "src/components/auth/SsoFlow.test.tsx",
  // components/layouts (flat duplicates)
  "src/components/layouts/AppShellLayout.tsx",
  "src/components/layouts/AppShellLayout.test.tsx",
  "src/components/layouts/AppTopbar.tsx",
  "src/components/layouts/AuthLayout.tsx",
  // components/shared (flat duplicates)
  "src/components/shared/PolariaDataTable.tsx",
  "src/components/shared/PolariaDataTable.test.tsx",
  "src/components/shared/PolariaTableCells.tsx",
  "src/components/shared/PolariaTablePaginationFooter.tsx",
  "src/components/shared/PolariaFormField.tsx",
  "src/components/shared/PolariaFormModal.tsx",
  "src/components/shared/PolariaFormModal.test.tsx",
  "src/components/shared/PolariaPhoneInput.tsx",
  "src/components/shared/PolariaSelectionCard.tsx",
  "src/components/shared/ModuleListPage.tsx",
  "src/components/shared/ModuleListPage.test.tsx",
  "src/components/shared/ModulePlaceholder.tsx",
  "src/components/shared/ModuleRoleGate.tsx",
  "src/components/shared/OperationalModuleShell.tsx",
  "src/components/shared/formatters.ts",
  "src/components/shared/polaria-table-layout.ts",
  // lib (flat duplicates)
  "src/lib/auth-storage.ts",
  "src/lib/auth-storage.test.ts",
  "src/lib/auth-session.ts",
  "src/lib/auth-sync.ts",
  "src/lib/auth-sync.test.ts",
  "src/lib/auth-broadcast.ts",
  "src/lib/auth-context.ts",
  "src/lib/auth-hash-import.ts",
  "src/lib/auth-hash-import.test.ts",
  "src/lib/auth-routes.ts",
  "src/lib/auth-routes.test.ts",
  "src/lib/mateo-sso-exit.ts",
  "src/lib/mateo-sso-exit.test.ts",
  "src/lib/cn.ts",
  "src/lib/domain-service-error.ts",
  "src/lib/domain-service-error.test.ts",
  "src/lib/decimal-es.ts",
  "src/lib/decimal-es.test.ts",
  "src/lib/active-bodega.ts",
  "src/lib/generate-codigo-cuenta.ts",
  "src/lib/generate-codigo-cuenta.test.ts",
  "src/lib/normalize-nivel-rol.ts",
  "src/lib/normalize-nivel-rol.test.ts",
  "src/lib/tenant-headers.ts",
  "src/lib/tenant-headers.test.ts",
  // hooks (flat duplicates)
  "src/hooks/usePermissions.ts",
  "src/hooks/usePermissions.test.tsx",
  "src/hooks/useAsyncQuery.ts",
  "src/hooks/useLiveDate.ts",
  "src/hooks/useTenantList.ts",
  "src/hooks/useClientTablePagination.ts",
  "src/hooks/useWarehouseStateRealtime.ts",
  "src/hooks/useWarehouseStateRealtime.test.tsx",
  // constants (flat duplicates)
  "src/constants/roles.ts",
  "src/constants/permissions.ts",
  "src/constants/wms-roles.ts",
  "src/constants/brand.ts",
  "src/constants/phone-countries.ts",
  "src/constants/phone-countries.test.ts",
  "src/constants/table-pagination.ts",
  // providers / services (flat duplicates)
  "src/providers/AuthProvider.tsx",
  "src/providers/CompanyProvider.tsx",
  "src/providers/CompanyProvider.test.tsx",
  "src/services/api.ts",
  "src/services/api.test.ts",
  "src/services/supabase.ts",
];

for (const rel of legacyDirs) {
  const abs = join(root, rel);
  if (existsSync(abs)) {
    rmSync(abs, { recursive: true, force: true });
    console.log(`Removed ${rel}`);
  }
}

for (const rel of legacyFiles) {
  const abs = join(root, rel);
  if (existsSync(abs)) {
    unlinkSync(abs);
    console.log(`Removed ${rel}`);
  }
}
