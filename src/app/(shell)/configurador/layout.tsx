import { PlatformScopeGuard } from "@/components/auth/PlatformScopeGuard";
import { ConfiguratorBreadcrumb } from "@/modules/configurator";

export default function ConfiguradorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PlatformScopeGuard>
      <div className="flex flex-1 flex-col">
        <ConfiguratorBreadcrumb />
        {children}
      </div>
    </PlatformScopeGuard>
  );
}
