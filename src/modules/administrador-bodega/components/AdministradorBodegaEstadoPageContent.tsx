"use client";

import { EstadoBodegaPageContent } from "@/modules/warehouses";
import { AdministradorBodegaOperacionTabs } from "./AdministradorBodegaOperacionTabs";

export function AdministradorBodegaEstadoPageContent() {
  return (
    <EstadoBodegaPageContent
      operacionTabs={<AdministradorBodegaOperacionTabs activeTab="estado" />}
    />
  );
}
