"use client";

import { BodegaReportesPageContent } from "@/modules/warehouses";
import { AdministradorBodegaOperacionTabs } from "./AdministradorBodegaOperacionTabs";

export function AdministradorBodegaReportesPageContent() {
  return (
    <BodegaReportesPageContent
      operacionTabs={<AdministradorBodegaOperacionTabs activeTab="reportes" />}
    />
  );
}
