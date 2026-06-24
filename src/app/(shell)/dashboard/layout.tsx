import { BodegaRequiredGuard } from "@/components/auth/BodegaRequiredGuard";
import { TenantScopeGuard } from "@/components/auth/TenantScopeGuard";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TenantScopeGuard>
      <BodegaRequiredGuard>{children}</BodegaRequiredGuard>
    </TenantScopeGuard>
  );
}
