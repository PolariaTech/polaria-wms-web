"use client";

import type { ReactNode } from "react";

export function OrdenCompraDetalleMetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}
