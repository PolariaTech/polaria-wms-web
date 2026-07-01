import { AdminBreadcrumb } from "@/modules/admin-panel";

export default function DashboardReporteriaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <AdminBreadcrumb />
      {children}
    </div>
  );
}
