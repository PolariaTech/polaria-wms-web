import { AppShellLayout } from "@/components/layouts/shell/AppShellLayout";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
