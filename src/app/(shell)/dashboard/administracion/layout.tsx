import { AdminAccountGuard } from "@/components/auth/AdminAccountGuard";
import { AdminBreadcrumb } from "@/modules/admin-panel";

export default function DashboardAdministracionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAccountGuard>
      <div className="flex flex-1 flex-col">
        <AdminBreadcrumb />
        {children}
      </div>
    </AdminAccountGuard>
  );
}
