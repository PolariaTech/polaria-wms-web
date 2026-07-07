import { BodegaRequiredGuard } from "@/components/auth/guards/BodegaRequiredGuard";
import { TenantScopeGuard } from "@/components/auth/guards/TenantScopeGuard";

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
