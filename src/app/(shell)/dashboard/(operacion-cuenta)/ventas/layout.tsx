import { VentasSidebar } from "@/modules/sales/correos/components/VentasSidebar";

/** Ventas: sidebar de correos (REQ-104) junto al contenido de cada pantalla del módulo. */
export default function VentasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
      <VentasSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
