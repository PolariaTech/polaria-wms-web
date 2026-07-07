"use client";

import { BodegaOperacionTabs } from "@/modules/warehouses";
import {
  ADMINISTRADOR_BODEGA_OPERACION_TABS,
  type AdministradorBodegaTabId,
} from "../constants/administrador-bodega-tabs";

interface AdministradorBodegaOperacionTabsProps {
  activeTab: AdministradorBodegaTabId;
}

export function AdministradorBodegaOperacionTabs({
  activeTab,
}: AdministradorBodegaOperacionTabsProps) {
  return (
    <BodegaOperacionTabs
      tabs={ADMINISTRADOR_BODEGA_OPERACION_TABS}
      activeTab={activeTab}
      ariaLabel="Operación administrador de bodega"
    />
  );
}
